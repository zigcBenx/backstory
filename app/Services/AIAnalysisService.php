<?php

namespace App\Services;

use App\Models\Ecosystem;
use App\Models\Activity;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAnalysisService
{
    private string $openaiApiKey;
    private string $baseUrl = 'https://api.openai.com/v1';

    public function __construct()
    {
        $this->openaiApiKey = config('services.openai.api_key');
    }

    public function analyzeIncident(Ecosystem $ecosystem, array $incidentData): array
    {
        try {
            // Get activities for the specified timeframe
            $activities = $this->getActivitiesForTimeframe($ecosystem, $incidentData['timeframe']);

            // Prepare context for AI
            $context = $this->prepareContext($ecosystem, $activities, $incidentData);

            // Create the prompt
            $prompt = $this->createAnalysisPrompt($context, $incidentData);

            // Call OpenAI API
            $response = $this->callOpenAI($prompt);

            return [
                'success' => true,
                'analysis' => $response,
                'activities_analyzed' => $activities->count(),
                'timeframe' => $incidentData['timeframe']
            ];

        } catch (\Exception $e) {
            Log::error('AI Analysis failed', [
                'ecosystem_id' => $ecosystem->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Analysis failed: ' . $e->getMessage()
            ];
        }
    }

    private function getActivitiesForTimeframe(Ecosystem $ecosystem, string $timeframe): \Illuminate\Database\Eloquent\Collection
    {
        $startTime = match($timeframe) {
            '1h' => Carbon::now()->subHour(),
            '6h' => Carbon::now()->subHours(6),
            '24h' => Carbon::now()->subDay(),
            '7d' => Carbon::now()->subWeek(),
            default => Carbon::now()->subDay()
        };

        return Activity::where('ecosystem_id', $ecosystem->id)
            ->where('created_at', '>=', $startTime)
            ->with('activityType')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    private function prepareContext(Ecosystem $ecosystem, $activities, array $incidentData): array
    {
        $activitiesData = $activities->map(function ($activity) {
            return [
                'timestamp' => $activity->created_at->toISOString(),
                'title' => $activity->title,
                'description' => $activity->description,
                'type' => $activity->activityType->name,
                'user' => $activity->user_name,
                'metadata' => $activity->metadata ?? []
            ];
        });

        return [
            'ecosystem' => [
                'name' => $ecosystem->name,
                'description' => $ecosystem->description
            ],
            'incident' => $incidentData,
            'activities' => $activitiesData->toArray(),
            'timeframe' => $incidentData['timeframe'],
            'analysis_time' => Carbon::now()->toISOString()
        ];
    }

    private function createAnalysisPrompt(array $context, array $incidentData): string
    {
        $activitiesJson = json_encode($context['activities'], JSON_PRETTY_PRINT);

        return "You are an expert DevOps incident analyst. Analyze the following ecosystem activities and incident report to provide actionable insights.

## ECOSYSTEM CONTEXT
- **Name**: {$context['ecosystem']['name']}
- **Description**: {$context['ecosystem']['description']}

## INCIDENT DETAILS
- **Type**: {$incidentData['type']}
- **Severity**: {$incidentData['severity']}
- **Description**: {$incidentData['description']}
- **Analysis Timeframe**: {$incidentData['timeframe']}

## RECENT ACTIVITIES ({$context['timeframe']})
```json
{$activitiesJson}
```

## ANALYSIS REQUEST
Please provide a comprehensive incident analysis with:

1. **ROOT CAUSE ANALYSIS**: Based on the timing and sequence of activities, what likely caused this incident? Look for:
   - Recent deployments or changes that correlate with the incident timing
   - Configuration changes
   - Infrastructure modifications
   - Pattern anomalies

2. **CORRELATION FINDINGS**: Identify specific activities that may be related to the incident:
   - Activities occurring just before the incident
   - Unusual activity patterns
   - Missing expected activities (e.g., health checks, monitoring)

3. **IMMEDIATE ACTIONS**: What should be done right now to address the incident?
   - Quick fixes or rollbacks
   - Emergency procedures
   - Monitoring points to check

4. **PREVENTION RECOMMENDATIONS**: How can similar incidents be prevented?
   - Process improvements
   - Additional monitoring
   - Deployment safeguards
   - Team practices

5. **NEXT STEPS**: What follow-up actions are recommended?
   - Investigation areas
   - System improvements
   - Documentation updates

## OUTPUT FORMAT
Provide your analysis in clear, actionable sections. Be specific about which activities are relevant and why. If you don't find direct correlations, suggest what additional information would be helpful.

Focus on practical, implementable recommendations that a DevOps team can act on immediately.";
    }

    private function callOpenAI(string $prompt): string
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->openaiApiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post($this->baseUrl . '/chat/completions', [
            'model' => 'gpt-4o-mini',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an expert DevOps incident analyst with deep knowledge of system operations, deployment patterns, and incident response. Provide clear, actionable analysis that helps teams quickly understand and resolve issues.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'max_tokens' => 2000,
            'temperature' => 0.3,
        ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API call failed: ' . $response->body());
        }

        $data = $response->json();

        if (!isset($data['choices'][0]['message']['content'])) {
            throw new \Exception('Invalid OpenAI response format');
        }

        return $data['choices'][0]['message']['content'];
    }
}