<?php

namespace App\Services;

use App\Models\Integration;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class IntegrationService
{
    /**
     * Default file paths for different services
     */
    private const DEFAULT_PATHS = [
        'nginx' => [
            '/etc/nginx/nginx.conf',
            '/etc/nginx/sites-available',
            '/etc/nginx/sites-enabled',
            '/etc/nginx/conf.d',
            '/usr/local/etc/nginx',  # Homebrew on macOS
            '/opt/homebrew/etc/nginx',  # Homebrew on Apple Silicon
        ],
        'apache' => [
            '/etc/apache2/apache2.conf',
            '/etc/apache2/sites-available',
            '/etc/apache2/sites-enabled',
            '/etc/apache2/conf-available',
            '/etc/apache2/conf-enabled',
            '/usr/local/etc/httpd',  # Homebrew on macOS
            '/opt/homebrew/etc/httpd',  # Homebrew on Apple Silicon
        ],
        'cron' => [
            '/etc/crontab',
            '/etc/cron.d',
            '/var/spool/cron/crontabs',
            '/var/spool/cron',  # Some systems
        ],
        'ssh' => [
            '/etc/ssh/sshd_config',
            '/etc/ssh/ssh_config',
            '~/.ssh/config',  # User SSH config (local development)
        ],
        'ssl' => [
            '/etc/ssl/certs',
            '/etc/ssl/private',
            '/etc/letsencrypt/live',
            '~/.ssl',  # Local development SSL
        ],
        'development' => [
            # Common development files to test with
            '~/test-config.txt',
            '~/.bashrc',
            '~/.profile',
            '~/.gitconfig',
        ],
    ];

    /**
     * Create a server monitoring integration
     */
    public function createServerMonitoring(array $data): Integration
    {
        Log::info('IntegrationService createServerMonitoring called with:', $data);

        $integration = Integration::create([
            'ecosystem_id' => $data['ecosystem_id'],
            'name' => $data['name'] ?? 'Server Configuration Monitor',
            'type' => 'server-monitor',
            'description' => 'Monitors server configuration files for changes',
            'icon' => 'server',
            'category' => 'Infrastructure',
            'connected' => true, // Set as connected when configured
            'config' => [
                'monitoring' => $data['monitoring'] ?? [],
                'custom_paths' => $data['custom_paths'] ?? [],
            ],
        ]);

        Log::info('Integration created:', $integration->toArray());

        // Create API key for this integration
        $apiKey = $integration->createApiKey('Server Monitor');

        Log::info('API key created:', ['key_id' => $apiKey->id, 'integration_id' => $integration->id]);

        return $integration;
    }

    /**
     * Generate the monitoring script for an integration
     */
    public function generateMonitoringScript(Integration $integration): string
    {
        $apiKey = $integration->apiKeys()->where('active', true)->first();
        logger('API KEY: ' . $apiKey->key);

        if (!$apiKey) {
            throw new \Exception('No active API key found for integration');
        }

        $template = Storage::get('integration-scripts/server-monitor.sh');
        logger("TEmplate" . $template);
        $replacements = [
            '{{API_URL}}' => config('app.url'),
            '{{API_KEY}}' => $apiKey->key,
            '{{ECOSYSTEM_ID}}' => $integration->ecosystem_id,
            '{{INTEGRATION_ID}}' => $integration->id,
            '{{NGINX_PATHS}}' => $this->getPathsForType($integration, 'nginx'),
            '{{APACHE_PATHS}}' => $this->getPathsForType($integration, 'apache'),
            '{{CRON_PATHS}}' => $this->getPathsForType($integration, 'cron'),
            '{{SSH_PATHS}}' => $this->getPathsForType($integration, 'ssh'),
            '{{SSL_PATHS}}' => $this->getPathsForType($integration, 'ssl'),
            '{{DEVELOPMENT_PATHS}}' => $this->getPathsForType($integration, 'development'),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    /**
     * Get paths for a specific monitoring type
     */
    private function getPathsForType(Integration $integration, string $type): string
    {
        $config = $integration->config;
        $monitoring = $config['monitoring'] ?? [];

        // If this type is not being monitored, return false
        if (!in_array($type, $monitoring)) {
            return 'false';
        }

        // Get custom paths or use defaults
        $customPaths = $config['custom_paths'][$type] ?? [];
        $paths = !empty($customPaths) ? $customPaths : self::DEFAULT_PATHS[$type];

        return implode(',', $paths);
    }

    /**
     * Get default paths for a service type
     */
    public function getDefaultPaths(string $type): array
    {
        return self::DEFAULT_PATHS[$type] ?? [];
    }

    /**
     * Get all available monitoring types
     */
    public function getAvailableTypes(): array
    {
        return [
            'nginx' => [
                'name' => 'Nginx Configuration',
                'description' => 'Monitor Nginx web server configuration files',
                'icon' => 'server',
                'default_paths' => self::DEFAULT_PATHS['nginx'],
            ],
            'apache' => [
                'name' => 'Apache Configuration',
                'description' => 'Monitor Apache web server configuration files',
                'icon' => 'server',
                'default_paths' => self::DEFAULT_PATHS['apache'],
            ],
            'cron' => [
                'name' => 'Cron Jobs',
                'description' => 'Monitor cron job configurations and schedules',
                'icon' => 'clock',
                'default_paths' => self::DEFAULT_PATHS['cron'],
            ],
            'ssh' => [
                'name' => 'SSH Configuration',
                'description' => 'Monitor SSH daemon and client configurations',
                'icon' => 'shield',
                'default_paths' => self::DEFAULT_PATHS['ssh'],
            ],
            'ssl' => [
                'name' => 'SSL Certificates',
                'description' => 'Monitor SSL certificate files and configurations',
                'icon' => 'lock',
                'default_paths' => self::DEFAULT_PATHS['ssl'],
            ],
            'development' => [
                'name' => 'Development Files',
                'description' => 'Monitor common development/config files (for testing)',
                'icon' => 'file-text',
                'default_paths' => self::DEFAULT_PATHS['development'],
            ],
        ];
    }

    /**
     * Update integration configuration
     */
    public function updateConfiguration(Integration $integration, array $config): Integration
    {
        $integration->update([
            'config' => array_merge($integration->config ?? [], $config),
        ]);

        return $integration;
    }

    /**
     * Mark integration as connected
     */
    public function markAsConnected(Integration $integration): Integration
    {
        $integration->update([
            'connected' => true,
            'last_sync_at' => now(),
        ]);

        return $integration;
    }

    /**
     * Process heartbeat from server monitor
     */
    public function processHeartbeat(Integration $integration, array $data): void
    {
        $integration->update([
            'last_sync_at' => now(),
            'config' => array_merge($integration->config ?? [], [
                'last_heartbeat' => $data,
            ]),
        ]);
    }

    /**
     * Process file change notification
     */
    public function processFileChange(Integration $integration, array $data): void
    {
        // Update last sync time
        $integration->update(['last_sync_at' => now()]);

        // Here you would typically create an Activity record
        // For now, we'll just log it in the integration config
        $fileChanges = $integration->config['file_changes'] ?? [];
        $fileChanges[] = [
            'timestamp' => $data['timestamp'],
            'file_path' => $data['file_path'],
            'event_type' => $data['event_type'],
            'file_type' => $data['file_type'],
            'server_info' => $data['server_info'],
        ];

        // Keep only last 100 file changes
        $fileChanges = array_slice($fileChanges, -100);

        $integration->update([
            'config' => array_merge($integration->config ?? [], [
                'file_changes' => $fileChanges,
            ]),
        ]);
    }
}