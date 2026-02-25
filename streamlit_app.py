import streamlit as st
import json
import os

# Path to the shared config file
CONFIG_PATH = os.path.join("lib", "config.json")

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            st.error(f"Error loading config: {e}")
    return {"headline": "This is my work", "subheadline": "SCROLL TO EXPLORE"}

def save_config(config):
    try:
        with open(CONFIG_PATH, "w", encoding='utf-8') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        st.error(f"Error saving config: {e}")
        return False

st.set_page_config(
    page_title="Soumya Ranjan | Portfolio",
    page_icon="🎥",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Shared Config Logic
CONFIG_PATH = os.path.join("lib", "config.json")

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            st.error(f"Error loading config: {e}")
    return {"headline": "This is my work", "subheadline": "SCROLL TO EXPLORE"}

def save_config(config):
    try:
        with open(CONFIG_PATH, "w", encoding='utf-8') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        st.error(f"Error saving config: {e}")
        return False

# Professional Styling
st.markdown(
    """
    <style>
    .stApp {
        background-color: #050505;
    }
    iframe {
        width: 100%;
        height: 90vh;
        border: none;
        border-radius: 0px;
        box-shadow: 0 4px 50px rgba(0,0,0,0.5);
    }
    [data-testid="stSidebar"] {
        background-color: #0a0a0a;
        border-right: 1px solid #1a1a1a;
    }
    .main-title {
        color: white;
        font-weight: 900;
        letter-spacing: -0.05em;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# Sidebar Branding & Control
with st.sidebar:
    st.markdown("<h2 style='color: white; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 0;'>SR</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 2rem;'>Portfolio v1.0</p>", unsafe_allow_html=True)
    
    app_mode = st.radio("Display Mode", ["Public View", "Editor Console"])
    
    st.divider()
    
    if app_mode == "Editor Console":
        st.markdown("### Content Management")
        config = load_config()
        headline = st.text_input("Hero Title", config.get("headline", ""))
        subheadline = st.text_input("Hero Tagline", config.get("subheadline", ""))
        
        if st.button("Apply Changes", use_container_width=True):
            new_config = {"headline": headline, "subheadline": subheadline}
            if save_config(new_config):
                st.success("Successfully Published!")
                st.balloons()
    else:
        st.markdown("### Viewer Info")
        st.info("Currently viewing the cinematic portfolio. Experience optimized for desktop viewers.")

# Main Display
# Pointing to /welcome as the professional entry point
st.components.v1.iframe("http://localhost:3000/welcome", height=900, scrolling=True)
