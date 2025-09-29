<?php

namespace App\Http\Controllers;

use App\Models\Ecosystem;
use App\Services\AIAnalysisService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AIAnalysisController extends Controller
{
    public function __construct(
        private AIAnalysisService $aiAnalysisService
    ) {}

    public function analyzeIncident(Request $request, Ecosystem $ecosystem): JsonResponse
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:production-error,performance-issue,deployment-issue,service-outage,other',
            'description' => 'required|string|min:10|max:2000',
            'timeframe' => 'required|string|in:1h,6h,24h,7d',
            'severity' => 'required|string|in:low,medium,high,critical'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if OpenAI API key is configured
        if (empty(config('services.openai.api_key'))) {
            return response()->json([
                'success' => false,
                'error' => 'AI service is not configured. Please contact your administrator.'
            ], 503);
        }

        try {
            // Perform AI analysis
            $result = $this->aiAnalysisService->analyzeIncident(
                $ecosystem,
                $request->only(['type', 'description', 'timeframe', 'severity'])
            );

            if (!$result['success']) {
                return response()->json($result, 500);
            }

            return response()->json([
                'success' => true,
                'analysis' => $result['analysis'],
                'meta' => [
                    'activities_analyzed' => $result['activities_analyzed'],
                    'timeframe' => $result['timeframe'],
                    'ecosystem' => $ecosystem->name
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'An unexpected error occurred during analysis.'
            ], 500);
        }
    }
}
