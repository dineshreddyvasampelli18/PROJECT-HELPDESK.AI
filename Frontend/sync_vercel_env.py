import subprocess
import os

def sync_env_to_vercel():
    env_file = ".env"
    if not os.path.exists(env_file):
        print(".env file not found")
        return

    with open(env_file, "r") as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        
        if "=" in line:
            key, value = line.split("=", 1)
            print(f"Adding {key} to Vercel...")
            # We use --force to overwrite if exists, but vercel env add doesn't have --force.
            # We delete first then add.
            subprocess.run(f"npx vercel env rm {key} -y", shell=True, capture_output=True)
            subprocess.run(f"echo {value} | npx vercel env add {key} production", shell=True)

if __name__ == "__main__":
    sync_env_to_vercel()
