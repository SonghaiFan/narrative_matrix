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

export interface NarrativeMetadata {
  name: string;
  description: string;
  type: string;
  subtype?: string;
  icon?: string;
  color?: string;
  order?: number;
  topic?: {
    main_topic: string;
    sub_topics: string[];
  };
  // Add missing properties as optional
  studyType?: string;
  quiz?: any[]; // Or a more specific QuizItem type if available
  quiz_recall?: any[]; // Or a more specific QuizItem type if available
  quiz_order_preference?: string; // e.g., 'default', 'reverse', etc.
}

export interface NarrativeMatrixData {
  metadata: NarrativeMetadata;
  events: NarrativeEvent[];
  quiz?: Quiz; // Add quiz property
}
