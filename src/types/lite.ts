import { Quiz } from "@/components/features/task/quiz-types";
import { QuizItem } from "../components/features/task/quiz-types";

export interface Entity {
  id: string; // Unique and unified entity ID
  name: string; // The name of the entity (person, organization, or abstract entity)
  social_role?:
    | "government" // State actors (e.g., presidents, ministers, institutions)
    | "corporate" // Business entities (e.g., CEOs, banks, financial institutions)
    | "expert" // Analysts, scientists, professionals (e.g., economists, legal experts)
    | "media" // Journalists, news organizations, social media influencers
    | "activist" // NGOs, advocacy groups, grassroots leaders
    | "public" // General population, citizens
    | "stakeholder" // Investors, lobbyists, unions, interest groups
    | "object"; // Non-human elements (laws, policies, economic forces)
  // Additional flexible attributes
  [key: string]: any; // Allow any additional attributes
}

export interface Topic {
  main_topic: string;
  sub_topic: string[];
  sentiment: {
    polarity: "positive" | "negative" | "neutral";
    intensity: number;
  };
}

export interface NarrativeEvent {
  index: number;
  text: string;
  short_text: string;
  lead_title?: string; // Title before the event  started with ###
  temporal_anchoring: {
    real_time: string | [string, string] | null;
    narrative_time: number;
  };
  entities: Entity[];
  topic: Topic;
}

// Scenario Metadata - UI and configuration for each scenario
export interface ScenarioMetadata {
  id: string; // e.g., "text-visual-1"
  name: string; // Display name
  description: string; // Scenario description
  quizOrder: {
    preferredOrder: string[];
    description: string;
  };
}

// Dataset Metadata - Content metadata for the narrative
export interface DatasetMetadata {
  title: string; // e.g., "Ukraine Conflict"
  description: string; // Content description
  topic: string; // Main topic
  author: string;
  publishDate: string;
  imageUrl?: string | null;
  studyType?: string; // e.g., "text-visual"
  quiz_order_preference?: string; // e.g., "default"
}
