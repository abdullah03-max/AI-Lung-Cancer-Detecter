export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  createdAt?: string;
}

export interface ModelInfo {
  status: 'ready' | 'untrained' | 'training';
  model_architecture?: string;
  dataset_size?: number;
  num_classes?: number;
  classes: string[];
  model_version?: string;
  last_training_timestamp?: string;
  evaluation_metrics?: {
    test_sample_count: number;
    overall: {
      accuracy: number;
      precision_macro: number;
      recall_macro: number;
      f1_macro: number;
      roc_auc?: number;
    };
    confusion_matrix?: number[][];
    per_class_metrics?: Record<string, {
      precision: number;
      recall: number;
      f1_score: number;
      support: number;
    }>;
  };
  dataset_summary?: {
    total_images_scanned: number;
    classes: string[];
    class_distribution: Record<string, number>;
  };
  disclaimer: string;
}

export interface PredictionResult {
  id?: string;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_version: string;
  disclaimer: string;
  created_at?: string;
}

export interface PredictionHistoryItem {
  id: string;
  user_id: string;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_version: string;
  created_at: string;
}
