<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PublicInstallController extends Controller
{
    public function installScript()
    {
        $script = $this->generateInstallScript();

        return response($script)
            ->header('Content-Type', 'application/x-sh')
            ->header('Content-Disposition', 'inline; filename="backstory-install.sh"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    private function generateInstallScript(): string
    {
        $apiUrl = url('/api');

        return <<<SCRIPT
#!/bin/bash

# BackStory Server Monitor - Interactive Installation
# This script safely installs the BackStory monitoring system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="$apiUrl"
LOG_FILE=""
PID_FILE=""
INSTALLATION_TOKEN=""

echo -e "\${BLUE}======================================\${NC}"
echo -e "\${BLUE}    BackStory Server Monitor Setup    \${NC}"
echo -e "\${BLUE}======================================\${NC}"
echo ""

# Detect if running as root or regular user and set paths accordingly
ACTUAL_USER="\${SUDO_USER:-\$USER}"
ACTUAL_HOME=\$(eval echo ~\$ACTUAL_USER)

if [ "\$EUID" -eq 0 ]; then
    # Running as root (production or sudo)
    if [ -n "\$SUDO_USER" ]; then
        # Running with sudo - use actual user's home for development
        LOG_FILE="\$ACTUAL_HOME/.backstory-monitor.log"
        PID_FILE="\$ACTUAL_HOME/.backstory-monitor.pid"
        echo -e "\${YELLOW}Running as root via sudo, using \$ACTUAL_USER's home directory: \$ACTUAL_HOME\${NC}"
    else
        # Running as actual root (production)
        LOG_FILE="/var/log/backstory-monitor.log"
        PID_FILE="/var/run/backstory-monitor.pid"
        echo -e "\${YELLOW}Running as root (production mode)\${NC}"
    fi
else
    # Running as regular user (development/testing)
    LOG_FILE="\$HOME/.backstory-monitor.log"
    PID_FILE="\$HOME/.backstory-monitor.pid"
    echo -e "\${YELLOW}Running as regular user (development mode)\${NC}"
fi

echo ""

# Check if already running
if [ -f "\$PID_FILE" ]; then
    if kill -0 "\$(cat \$PID_FILE)" 2>/dev/null; then
        echo -e "\${RED}Error: BackStory monitor is already running (PID: \$(cat \$PID_FILE))\${NC}"
        echo -e "\${YELLOW}Stop it first with: kill \$(cat \$PID_FILE)\${NC}"
        exit 1
    else
        rm -f "\$PID_FILE"
    fi
fi

# Check dependencies
echo -e "\${BLUE}Checking dependencies...\${NC}"

if ! command -v curl &> /dev/null; then
    echo -e "\${RED}Error: curl is not installed.\${NC}"
    echo -e "\${YELLOW}Please install it using:\${NC}"
    echo -e "\${GREEN}  sudo apt-get update\${NC}"
    echo -e "\${GREEN}  sudo apt-get install curl\${NC}"
    exit 1
fi

if ! command -v inotifywait &> /dev/null; then
    echo -e "\${RED}Error: inotifywait is not installed.\${NC}"
    echo -e "\${YELLOW}Please install it using:\${NC}"
    echo -e "\${GREEN}  sudo apt-get update\${NC}"
    echo -e "\${GREEN}  sudo apt-get install inotify-tools\${NC}"
    echo ""
    echo -e "\${BLUE}This tool is required to monitor file changes safely and efficiently.\${NC}"
    exit 1
fi

echo -e "\${GREEN}✓ All dependencies are installed\${NC}"
echo ""

# Get installation token from user
echo -e "\${BLUE}Installation Token Required\${NC}"
echo -e "\${YELLOW}To complete the installation, you need an installation token from your BackStory dashboard.\${NC}"
echo ""
echo -e "\${BLUE}Steps to get your token:\${NC}"
echo -e "  1. Go to your BackStory dashboard"
echo -e "  2. Select your ecosystem"
echo -e "  3. Navigate to 'Server Monitoring' or 'Integrations'"
echo -e "  4. Click 'Generate Installation Token'"
echo -e "  5. Copy the token and paste it below"
echo ""

while [ -z "\$INSTALLATION_TOKEN" ]; do
    echo -ne "\${GREEN}Enter your installation token: \${NC}"
    read -r INSTALLATION_TOKEN < /dev/tty

    if [ -z "\$INSTALLATION_TOKEN" ]; then
        echo -e "\${RED}Token cannot be empty. Please try again.\${NC}"
        echo ""
    fi
done

echo ""
echo -e "\${BLUE}Validating token and setting up integration...\${NC}"

# Exchange installation token for integration credentials
exchange_response=\$(curl -s -w "\\n%{http_code}" -X POST \\
    -H "Content-Type: application/json" \\
    -d "{\\"installation_token\\": \\"\$INSTALLATION_TOKEN\\"}" \\
    "\$API_URL/integrations/install" 2>/dev/null)

http_code=\$(echo "\$exchange_response" | tail -n1)
response_body=\$(echo "\$exchange_response" | head -n -1)

if [ "\$http_code" -ne 200 ] && [ "\$http_code" -ne 201 ]; then
    echo -e "\${RED}Error: Failed to validate installation token (HTTP \$http_code)\${NC}"
    echo -e "\${RED}Response: \$response_body\${NC}"
    echo ""
    echo -e "\${YELLOW}Please check:\${NC}"
    echo -e "  • Token is correct and not expired"
    echo -e "  • Token hasn't been used already"
    echo -e "  • Your internet connection is working"
    echo -e "  • You have permission to create integrations in this ecosystem"
    exit 1
fi

# Parse response to get credentials
if ! command -v jq &> /dev/null; then
    echo -e "\${YELLOW}Warning: jq not installed. Installing jq for JSON parsing...\${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    else
        echo -e "\${RED}Error: Cannot install jq automatically. Please install jq and try again.\${NC}"
        exit 1
    fi
fi

API_KEY=\$(echo "\$response_body" | jq -r '.api_key')
ECOSYSTEM_ID=\$(echo "\$response_body" | jq -r '.ecosystem_id')
INTEGRATION_ID=\$(echo "\$response_body" | jq -r '.integration_id')
MONITOR_PATHS=\$(echo "\$response_body" | jq -r '.paths // []')

if [ "\$API_KEY" = "null" ] || [ "\$ECOSYSTEM_ID" = "null" ] || [ "\$INTEGRATION_ID" = "null" ]; then
    echo -e "\${RED}Error: Invalid response from server. Missing required credentials.\${NC}"
    exit 1
fi

echo -e "\${GREEN}✓ Installation token validated successfully!\${NC}"
echo -e "\${GREEN}✓ Integration created: ID \$INTEGRATION_ID\${NC}"
echo -e "\${GREEN}✓ Monitoring ecosystem: ID \$ECOSYSTEM_ID\${NC}"
echo ""

# Generate the actual monitoring script with real credentials
MONITOR_SCRIPT="\$HOME/.backstory-monitor.sh"
if [ "\$EUID" -eq 0 ] && [ -z "\$SUDO_USER" ]; then
    MONITOR_SCRIPT="/usr/local/bin/backstory-monitor.sh"
fi

echo -e "\${BLUE}Creating monitoring script at \$MONITOR_SCRIPT...\${NC}"

cat > "\$MONITOR_SCRIPT" << 'MONITOR_EOF'
#!/bin/bash

# BackStory Server Monitor Script
# Generated during installation - DO NOT SHARE THIS FILE

# Configuration (automatically generated)
API_URL="$apiUrl"
API_KEY="PLACEHOLDER_API_KEY"
ECOSYSTEM_ID="PLACEHOLDER_ECOSYSTEM_ID"
INTEGRATION_ID="PLACEHOLDER_INTEGRATION_ID"
PING_INTERVAL=60

# Detect if running as root or regular user and set paths accordingly
ACTUAL_USER="\${SUDO_USER:-\$USER}"
ACTUAL_HOME=\$(eval echo ~\$ACTUAL_USER)

if [ "\$EUID" -eq 0 ]; then
    if [ -n "\$SUDO_USER" ]; then
        LOG_FILE="\$ACTUAL_HOME/.backstory-monitor.log"
        PID_FILE="\$ACTUAL_HOME/.backstory-monitor.pid"
    else
        LOG_FILE="/var/log/backstory-monitor.log"
        PID_FILE="/var/run/backstory-monitor.pid"
    fi
else
    LOG_FILE="\$HOME/.backstory-monitor.log"
    PID_FILE="\$HOME/.backstory-monitor.pid"
fi

# Default monitoring paths
NGINX_PATHS="/etc/nginx,/etc/nginx/sites-available,/etc/nginx/sites-enabled"
APACHE_PATHS="/etc/apache2,/etc/httpd"
CRON_PATHS="/etc/cron.d,/etc/crontab,/var/spool/cron"
SSH_PATHS="/etc/ssh"
SSL_PATHS="/etc/ssl,/etc/letsencrypt"
DEVELOPMENT_PATHS="~/.bashrc,~/.gitconfig"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$1" | tee -a "\$LOG_FILE"
}

# Send API request to BackStory
send_api_request() {
    local endpoint="\$1"
    local data="\$2"
    local method="\${3:-POST}"

    local response
    response=\$(curl -s -w "\\n%{http_code}" -X "\$method" \\
        -H "Content-Type: application/json" \\
        -H "X-API-Key: \$API_KEY" \\
        -d "\$data" \\
        "\$API_URL/\$endpoint" 2>/dev/null)

    local http_code=\$(echo "\$response" | tail -n1)
    local body=\$(echo "\$response" | head -n -1)

    if [ "\$http_code" -eq 200 ] || [ "\$http_code" -eq 201 ]; then
        return 0
    else
        log "API Error: HTTP \$http_code - \$body"
        return 1
    fi
}

# Send heartbeat ping
send_heartbeat() {
    local data=\$(cat <<EOF
{
    "type": "heartbeat",
    "ecosystem_id": "\$ECOSYSTEM_ID",
    "integration_id": "\$INTEGRATION_ID",
    "timestamp": "\$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "status": "online",
    "server_info": {
        "hostname": "\$(hostname)",
        "os": "\$(lsb_release -d 2>/dev/null | cut -f2 || echo 'Unknown')",
        "uptime": "\$(uptime -p 2>/dev/null || echo 'Unknown')"
    }
}
EOF
    )

    if send_api_request "integrations/heartbeat" "\$data"; then
        log "✓ Heartbeat sent successfully"
    else
        log "✗ Failed to send heartbeat"
    fi
}

# Send file change notification
send_file_change() {
    local file_path="\$1"
    local event_type="\$2"
    local file_type="\$3"
    local before_content="\$4"
    local after_content="\$5"

    local before_content_b64=""
    local after_content_b64=""

    if [ -n "\$before_content" ]; then
        before_content_b64=\$(echo "\$before_content" | head -n 1000 | base64 -w 0)
    fi

    if [ -n "\$after_content" ]; then
        after_content_b64=\$(echo "\$after_content" | head -n 1000 | base64 -w 0)
    fi

    local data=\$(cat <<EOF
{
    "type": "file_change",
    "ecosystem_id": "\$ECOSYSTEM_ID",
    "integration_id": "\$INTEGRATION_ID",
    "timestamp": "\$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "file_path": "\$file_path",
    "event_type": "\$event_type",
    "file_type": "\$file_type",
    "file_content": "\$after_content_b64",
    "before_content": "\$before_content_b64",
    "after_content": "\$after_content_b64",
    "server_info": {
        "hostname": "\$(hostname)"
    }
}
EOF
    )

    if send_api_request "integrations/file-change" "\$data"; then
        log "✓ File change reported: \$file_path (\$event_type)"
    else
        log "✗ Failed to report file change: \$file_path"
    fi
}

# Get file type from path
get_file_type() {
    local path="\$1"
    case "\$path" in
        */nginx/* | */nginx.conf | */sites-available/* | */sites-enabled/*) echo "nginx" ;;
        */apache* | */httpd/* | *apache*.conf) echo "apache" ;;
        */cron* | */crontab) echo "cron" ;;
        */ssh/* | */.ssh/* | */sshd_config) echo "ssh" ;;
        */ssl/* | *.crt | *.key | *.pem) echo "ssl" ;;
        */.bashrc | */.profile | */.gitconfig) echo "development" ;;
        *) echo "unknown" ;;
    esac
}

# Monitor files for changes
monitor_files() {
    local watch_paths=()

    # Add paths that exist
    IFS=',' read -ra paths <<< "\$NGINX_PATHS"
    for path in "\${paths[@]}"; do
        if [ -e "\$path" ]; then
            watch_paths+=("\$path")
            log "Monitoring nginx: \$path"
        fi
    done

    IFS=',' read -ra paths <<< "\$APACHE_PATHS"
    for path in "\${paths[@]}"; do
        if [ -e "\$path" ]; then
            watch_paths+=("\$path")
            log "Monitoring apache: \$path"
        fi
    done

    # Add other path types...

    if [ \${#watch_paths[@]} -eq 0 ]; then
        log "No valid paths to monitor. Exiting."
        exit 1
    fi

    log "Starting file monitoring for \${#watch_paths[@]} paths"

    # Track file contents for diff
    declare -A file_contents
    for path in "\${watch_paths[@]}"; do
        if [ -f "\$path" ] && [ -r "\$path" ]; then
            file_contents["\$path"]=\$(cat "\$path" 2>/dev/null)
        fi
    done

    # Monitor with inotifywait
    declare -A last_event_time
    inotifywait -m -e modify,create,delete,move "\${watch_paths[@]}" --format '%w%f %e' |
    while read file event; do
        current_time=\$(date +%s)
        if [ "\${last_event_time[\$file]:-0}" -gt \$((current_time - 2)) ]; then
            continue
        fi
        last_event_time["\$file"]=\$current_time

        file_type=\$(get_file_type "\$file")
        log "File change detected: \$file (\$event) - Type: \$file_type"

        before_content="\${file_contents[\$file]:-}"
        after_content=""
        if [ -f "\$file" ] && [ -r "\$file" ]; then
            after_content=\$(cat "\$file" 2>/dev/null)
            file_contents["\$file"]="\$after_content"
        fi

        send_file_change "\$file" "\$event" "\$file_type" "\$before_content" "\$after_content"
    done
}

# Heartbeat loop
heartbeat_loop() {
    while true; do
        send_heartbeat
        sleep \$PING_INTERVAL
    done
}

# Cleanup function
cleanup() {
    log "Stopping BackStory monitor..."
    if [ -f "\$PID_FILE" ]; then
        rm -f "\$PID_FILE"
    fi
    exit 0
}

# Signal handlers
trap cleanup SIGTERM SIGINT

# Main function
main() {
    echo -e "\${BLUE}BackStory Server Monitor\${NC}"
    echo -e "\${BLUE}========================\${NC}"
    echo ""

    # Check if already running
    if [ -f "\$PID_FILE" ]; then
        if kill -0 "\$(cat \$PID_FILE)" 2>/dev/null; then
            echo -e "\${YELLOW}Monitor is already running (PID: \$(cat \$PID_FILE))\${NC}"
            exit 1
        else
            rm -f "\$PID_FILE"
        fi
    fi

    # Store PID
    echo \$\$ > "\$PID_FILE"
    touch "\$LOG_FILE"
    chmod 644 "\$LOG_FILE"

    log "BackStory Server Monitor starting..."
    log "API URL: \$API_URL"
    log "Ecosystem ID: \$ECOSYSTEM_ID"
    log "Integration ID: \$INTEGRATION_ID"

    # Send initial heartbeat
    send_heartbeat

    # Start heartbeat loop in background
    heartbeat_loop &
    HEARTBEAT_PID=\$!

    # Start monitoring files
    monitor_files
}

# Handle command line arguments
case "\${1:-}" in
    "stop")
        if [ -f "\$PID_FILE" ]; then
            kill "\$(cat \$PID_FILE)" 2>/dev/null
            echo -e "\${GREEN}Monitor stopped.\${NC}"
        else
            echo -e "\${YELLOW}Monitor is not running.\${NC}"
        fi
        ;;
    "status")
        if [ -f "\$PID_FILE" ] && kill -0 "\$(cat \$PID_FILE)" 2>/dev/null; then
            echo -e "\${GREEN}Monitor is running (PID: \$(cat \$PID_FILE))\${NC}"
        else
            echo -e "\${YELLOW}Monitor is not running.\${NC}"
        fi
        ;;
    *)
        main
        ;;
esac

MONITOR_EOF

# Replace placeholders with actual values
sed -i "s/PLACEHOLDER_API_KEY/\$API_KEY/g" "\$MONITOR_SCRIPT"
sed -i "s/PLACEHOLDER_ECOSYSTEM_ID/\$ECOSYSTEM_ID/g" "\$MONITOR_SCRIPT"
sed -i "s/PLACEHOLDER_INTEGRATION_ID/\$INTEGRATION_ID/g" "\$MONITOR_SCRIPT"

chmod +x "\$MONITOR_SCRIPT"

echo -e "\${GREEN}✓ Monitoring script created successfully!\${NC}"
echo ""

# Ask if user wants to start monitoring now
echo -e "\${BLUE}Installation Complete!\${NC}"
echo ""
echo -e "\${YELLOW}Your BackStory server monitor is ready to use.\${NC}"
echo ""
echo -e "\${BLUE}To start monitoring:\${NC}"
echo -e "  \$MONITOR_SCRIPT"
echo ""
echo -e "\${BLUE}To stop monitoring:\${NC}"
echo -e "  kill \\$(cat \$PID_FILE)"
echo ""

read -p "Would you like to start monitoring now? (y/N): " -n 1 -r < /dev/tty
echo
if [[ \$REPLY =~ ^[Yy]$ ]]; then
    echo -e "\${GREEN}Starting BackStory monitor...\${NC}"
    "\$MONITOR_SCRIPT" &
    echo -e "\${GREEN}✓ Monitor started! Check your BackStory dashboard for activity.\${NC}"
else
    echo -e "\${YELLOW}Monitor not started. Run \$MONITOR_SCRIPT when ready.\${NC}"
fi

echo ""
echo -e "\${GREEN}🎉 Installation completed successfully!\${NC}"

SCRIPT;
    }
}
