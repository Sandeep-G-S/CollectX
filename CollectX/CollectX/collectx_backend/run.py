import subprocess
import time
import os

# Base directory
BASE_DIR = r"C:\New_Volume_D\Cognizant_CollectX_project\CollectX_customer\CollectX\collectx_backend"

# The specific order you requested
ORDERED_MODULES = [
    "eureka-server",
    "agent", "customer-service", "dunning", "field", "iam", 
    "legal", "notification", "payment", "portfolio", "report", "strategy",
    "api-gateway"
]

def launch_service(module_name):
    module_path = os.path.join(BASE_DIR, module_name)
    
    print(f"--- Launching {module_name.upper()} ---")
    
    if not os.path.exists(module_path):
        print(f"❌ Error: Folder not found: {module_path}")
        return

    try:
        # We use 'mvn spring-boot:run' which looks for the *Application.java file automatically
        # 'cmd /c' is required on Windows to execute the 'mvn' command via Python
        process_cmd = ["cmd", "/c", "mvn", "spring-boot:run"]
        
        subprocess.Popen(
            process_cmd, 
            cwd=module_path, 
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    except Exception as e:
        print(f"❌ Failed to start {module_name}: {e}")

def main():
    if not os.path.exists(BASE_DIR):
        print(f"❌ Base directory not found. Please check the path: {BASE_DIR}")
        return

    # 1. Start Eureka
    launch_service("eureka-server")
    print("⏳ Giving Eureka 20 seconds to boot up...")
    time.sleep(20)

    # 2. Start all microservices in order
    for module in ORDERED_MODULES[1:-1]:
        launch_service(module)
        time.sleep(5) # Delay to keep your laptop from lagging out

    # 3. Start API Gateway last
    print("⏳ Starting API Gateway...")
    time.sleep(10)
    launch_service("api-gateway")

    print("\n✅ All CollectX modules have been signaled to start.")

if __name__ == "__main__":
    main()