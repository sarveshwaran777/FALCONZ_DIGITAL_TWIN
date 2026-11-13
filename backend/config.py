import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FALCONZ - Indigenous Propulsion Digital Twin & SaaS Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Telemetry Streaming — 20 Hz high-speed zero-latency broadcast
    TELEMETRY_HZ: float = 20.0
    TELEMETRY_BUFFER_SIZE: int = 5000
    
    # Safety Limits (Hard Hardware Interlocks)
    MAX_RPM: float = 7500.0
    MAX_CURRENT_A: float = 38.0
    MAX_TEMP_C: float = 85.0
    MAX_VIBRATION_RMS: float = 12.0
    WATCHDOG_TIMEOUT_SEC: float = 2.0
    
    # Default Physical Parameters (SunnySky / T-Motor 2216 Class BLDC Testbed)
    MOTOR_KV: float = 880.0
    MOTOR_RESISTANCE_OHMS: float = 0.085
    MOTOR_NO_LOAD_CURRENT_A: float = 0.65
    MOTOR_POLE_PAIRS: int = 7
    THERMAL_CAPACITANCE_J_PER_K: float = 45.0
    THERMAL_RESISTANCE_K_PER_W: float = 1.45
    
    # Default Environmental
    DEFAULT_AMBIENT_TEMP_C: float = 25.0
    
    # Model Directory
    MODEL_DIR: str = os.path.join(os.path.dirname(__file__), "models")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'falconz_saas.db')}")
    
    # JWT Authentication & Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "falconz_aerospace_super_secure_jwt_secret_key_2026_xai")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # OpenAI API Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    # Razorpay Payment Gateway Configuration
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_falconz_2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "falconz_secret_mock_test_key_123")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "falconz_webhook_secret_key_456")
    
    # PDF Reports Directory
    REPORTS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "reports")

settings = Settings()
