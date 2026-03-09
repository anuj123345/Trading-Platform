import json
import tempfile
import csv
import streamlit as st
import pandas as pd
from phi.model.openai import OpenAIChat
from phi.agent.duckdb import DuckDbAgent
from phi.tools.pandas import PandasTools
import re
import os

# Page configuration
st.set_page_config(
    page_title="📊 AI Data Analyst Agent",
    page_icon="📊",
    layout="wide"
)

def preprocess_and_save(file):
    try:
        # Handle different file types
        if file.name.endswith('.csv'):
            df = pd.read_csv(file, encoding='utf-8')
        elif file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            st.error("Unsupported file format.")
            return None, None, None
            
        # Clean and format data
        for col in df.select_dtypes(include=['object']):
            df[col] = df[col].astype(str).replace({r'"': '""'}, regex=True)
            
        # Handle dates and numbers
        for col in df.columns:
            if 'date' in col.lower():
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Save to temp file for DuckDB
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
            temp_path = temp_file.name
            df.to_csv(temp_path, index=False, quoting=csv.QUOTE_ALL)
            
        return temp_path, df.columns.tolist(), df
    except Exception as e:
        st.error(f"Error processing file: {e}")
        return None, None, None

def main():
    st.title("📊 AI Data Analyst Agent")
    st.markdown("""
    Upload your data files (CSV/Excel) and ask questions in natural language. 
    The AI agent will analyze the data using SQL and Pandas to provide insights.
    """)

    with st.sidebar:
        st.header("Configuration")
        openai_key = st.text_input("Enter your OpenAI API key:", type="password")
        if openai_key:
            st.session_state.openai_key = openai_key
        
        st.divider()
        st.info("This agent uses DuckDB for fast SQL queries and Pandas for data manipulation.")

    if "openai_key" not in st.session_state or not st.session_state.openai_key:
        st.warning("Please enter your OpenAI API key in the sidebar to begin.")
        return

    uploaded_file = st.file_uploader("Upload a CSV or Excel file", type=["csv", "xlsx"])

    if uploaded_file is not None:
        temp_path, columns, df = preprocess_and_save(uploaded_file)
        
        if df is not None:
            col1, col2 = st.columns([2, 1])
            with col1:
                st.subheader("Data Preview")
                st.dataframe(df.head(100), use_container_width=True)
            
            with col2:
                st.subheader("Schema Information")
                st.write(f"**Total Rows:** {len(df)}")
                if columns:
                    st.write(f"**Total Columns:** {len(columns)}")
                    st.write("**Columns:**", columns)

            st.divider()
            
            st.subheader("Ask the Data Analyst")
            user_query = st.text_area("What would you like to know about this data?", 
                                     placeholder="e.g., What is the average value of [column]? or Give me a summary of [column] by [category]")

            if st.button("Analyze Data", type="primary"):
                if user_query.strip() == "":
                    st.warning("Please enter a query.")
                else:
                    with st.spinner('Analyzing your data...'):
                        try:
                            semantic_model = {
                                "tables": [
                                    {
                                        "name": "uploaded_data",
                                        "description": "Contains the uploaded dataset.",
                                        "path": temp_path,
                                    }
                                ]
                            }
                            
                            duckdb_agent = DuckDbAgent(
                                model=OpenAIChat(model="gpt-4o", api_key=st.session_state.openai_key),
                                semantic_model=json.dumps(semantic_model),
                                tools=[PandasTools()],
                                markdown=True,
                                system_prompt=(
                                    "You are an expert data analyst. Generate SQL queries to answer the user's question "
                                    "based on the 'uploaded_data' table. \n\n"
                                    "If the user asks for a chart or visualization:\n"
                                    "1. Use the PandasTools to generate the necessary plot using libraries like Plotly or Matplotlib if appropriate.\n"
                                    "2. Ensure the code for the chart is executable within the Streamlit context.\n"
                                    "3. Always provide a text-based summary of your findings alongside any charts."
                                )
                            )
                            
                            response = duckdb_agent.run(user_query)
                            st.markdown(response.content)
                            
                        except Exception as e:
                            st.error(f"Analysis failed: {e}")
                        finally:
                            # Clean up temp file if needed (actually DuckDB needs it while running)
                            pass

if __name__ == "__main__":
    main()
