# Quiz Design Guidelines for Narrative Comprehension Assessment

## Overview

This guide outlines how to design narrative comprehension questions that evaluate understanding at different cognitive levels. The questions are designed to be administered consistently across different interface conditions (visualization vs. LLM) to ensure fair comparison.

The design is grounded in established comprehension frameworks and cognitive models:

- Based on Kintsch's construction-integration model of text comprehension
- Aligned with narrative understanding research on textbase vs. situation model levels
- Structured to evaluate both surface-level understanding and deeper reasoning
- Designed to capture both objective metrics and qualitative insights

## Question Types and Their Applications

### 1. Information Retrieval Level

**Purpose**: Test basic fact recall and recognition of explicit details from the narrative.

**Theoretical Basis**:

- Corresponds to textbase level comprehension
- Tests formation of verbatim text representation
- Provides baseline measures of comprehension
- Ensures participants notice and can reproduce key facts

**Recommended Question Types**:

- `radio-options`: For clear, mutually exclusive choices
  - Example: "Which organization initiated the first action?"
  - Example: "What was the primary cause of the initial conflict?"

### 2. Pattern Recognition Level

**Purpose**: Evaluate ability to identify trends, relationships, and patterns across the narrative.

**Theoretical Basis**:

- Tests construction of narrative macrostructure
- Evaluates temporal and relational comprehension
- Assesses ability to track co-occurrence of events and entities
- Measures integration of multiple narrative elements

**Recommended Question Types**:

- `numbered-sequence`: For chronological ordering of events

  - Example: "Arrange these events in the order they occurred"
  - Example: "Put these policy changes in chronological order"

- `grid-matching`: For relationship mapping

  - Example: "Match each organization to its role in the conflict"
  - Example: "Connect each event to its primary location"

- `multiple-select`: For identifying multiple related elements
  - Example: "Which factors contributed to the escalation?"
  - Example: "Select all organizations involved in the negotiations"

### 3. Causal Reasoning Level

**Purpose**: Assess deeper understanding of cause-effect relationships and implications.

**Theoretical Basis**:

- Evaluates construction of situation model
- Tests ability to infer implicit relationships
- Measures integration of text information with logical reasoning
- Assesses understanding of motives and consequences

**Recommended Question Types**:

- `grid-matching`: For cause-effect relationships

  - Example: "Match each cause to its corresponding effect"
  - Example: "Connect each policy change to its impact"

- `multiple-select`: For identifying multiple causes or effects

  - Example: "Select all factors that contributed to the escalation"
  - Example: "Which consequences resulted from the policy change?"

- `radio-options`: For primary cause/effect identification
  - Example: "What was the main cause of the conflict?"
  - Example: "Which factor had the most significant impact?"

## Implementation Guidelines

### Question Structure

1. Each question must include:

   - Clear, unambiguous wording
   - Specific answer criteria
   - Appropriate difficulty level for the cognitive tier
   - Reference to relevant narrative events

2. Answer Validation:
   - `single-input`: Exact match or predefined variations
   - `radio-options`: One correct option with plausible distractors
   - `multiple-select`: All correct options must be selected
   - `numbered-sequence`: Exact order matching
   - `grid-matching`: All correct pairs must be matched

### Scoring Considerations

1. Objective Scoring:

   - Use exact matching for `single-input`, `radio-options`, `numbered-sequence`
   - Implement partial credit for `multiple-select` and `grid-matching`
   - Track completion status for all questions

2. Response Validation:
   - Consider common variations in text input
   - Handle case sensitivity appropriately
   - Account for minor spelling variations
   - Validate against predefined answer sets

### Best Practices

1. Question Design:

   - Keep questions focused and specific
   - Avoid ambiguous wording
   - Ensure answers are verifiable from the narrative
   - Maintain consistent difficulty within each level
   - Consider interface-specific advantages (e.g., visualization for patterns, LLM for causal reasoning)

2. Answer Design:

   - Provide clear, unambiguous correct answers
   - Include plausible distractors for multiple choice
   - Consider common misconceptions
   - Account for different valid interpretations
   - Design for objective scoring while capturing depth of understanding

3. Technical Implementation:
   - Use appropriate question types for the cognitive level
   - Implement robust answer validation
   - Provide clear feedback mechanisms
   - Track completion status
   - Ensure consistent delivery across interface conditions

## Example Questions by Level

### Information Retrieval

```typescript
{
  type: "single-input",
  question: "What was the date of the first protest?",
  answer: "January 15, 2024",
  level: "Information Retrieval"
}
```

### Pattern Recognition

```typescript
{
  type: "grid-matching",
  question: "Match each organization to its role in the conflict",
  options: {
    leftItems: ["Organization A", "Organization B", "Organization C"],
    rightItems: ["Primary Mediator", "Main Opponent", "Neutral Observer"],
    leftLabel: "Organization",
    rightLabel: "Role"
  },
  level: "Pattern Recognition"
}
```

### Causal Reasoning

```typescript
{
  type: "grid-matching",
  question: "Match each cause to its corresponding effect in the conflict",
  options: {
    leftItems: [
      "Lack of communication",
      "Resource allocation",
      "Policy changes"
    ],
    rightItems: [
      "Escalation of tensions",
      "Reduced operational capacity",
      "Shift in stakeholder dynamics"
    ],
    leftLabel: "Cause",
    rightLabel: "Effect"
  },
  level: "Causal Reasoning"
}
```

## Research Considerations

1. Interface Comparison:

   - Questions must be identical across conditions
   - Scoring criteria must be consistent
   - Consider how each interface might support different types of questions
   - Account for potential interface-specific advantages

2. Performance Metrics:

   - Track accuracy rates by question type
   - Measure response times
   - Consider partial credit where appropriate
   - Document interface-specific patterns

3. Analysis Framework:
   - Compare performance across cognitive levels
   - Analyze interface effects on different question types
   - Consider interaction between question type and interface
   - Document qualitative differences in responses

## Task Balancing Across Interface Conditions

### Overview

Questions must be balanced to fairly evaluate the strengths of both text-based (LLM) and visualization-based interfaces. Each quiz set should include an equal distribution of tasks that favor different interface types.

### Text/LLM-Optimized Tasks (50%)

Tasks where text search or LLM assistance might be more efficient:

1. **Specific Fact Retrieval**

```typescript
{
  type: "single-input",
  question: "On what date did the United States announce the ceasefire mediation?",
  answer: "January 15, 2025",
  level: "Information Retrieval"
}
```

2. **Entity Relationship Details**

```typescript
{
  type: "radio-options",
  question: "Which countries were involved in mediating the ceasefire?",
  options: [
    "United States, Egypt, and Qatar",
    "United States and Egypt only",
    "Egypt and Qatar only",
    "United States and Qatar only"
  ],
  level: "Information Retrieval"
}
```

### Visualization-Optimized Tasks (50%)

Tasks where visual analytics provide clearer insights:

1. **Temporal Pattern Recognition**

```typescript
{
  type: "multiple-select",
  question: "Which topics showed increased activity during 2020-2025?",
  options: [
    "armed conflict",
    "peace negotiations",
    "civil unrest",
    "human rights"
  ],
  level: "Pattern Recognition"
}
```

2. **Multi-Entity Interactions**

```typescript
{
  type: "grid-matching",
  question: "Match each period with its dominant interaction pattern",
  options: {
    leftItems: ["2020-2021", "2022-2023", "2024-2025"],
    rightItems: [
      "High armed conflict, low negotiations",
      "Balanced conflict and negotiations",
      "Increased peace talks, decreased conflict"
    ],
    leftLabel: "Time Period",
    rightLabel: "Pattern"
  },
  level: "Pattern Recognition"
}
```

### Balance Guidelines

1. **Question Distribution**

   - 50% text-optimized questions:

     - Direct fact queries
     - Specific entity details
     - Explicit statement verification
     - Sequential event details

   - 50% visualization-optimized questions:
     - Temporal patterns
     - Topic co-occurrence
     - Trend analysis
     - Entity interaction patterns

2. **Cognitive Level Distribution**
   For each interface type (text/visualization):
   - 35% Information Retrieval
   - 35% Pattern Recognition
   - 20% Causal Reasoning
   - 10% Sanity Check (split between Information Retrieval and Pattern Recognition levels)

### Sanity Check Questions

**Purpose**: Verify that users aren't making assumptions beyond the provided information and can identify what information is/isn't present in the narrative.

**Key Characteristics**:

- Tests awareness of information boundaries
- Includes plausible but absent information
- Helps detect over-interpretation
- Validates critical thinking

**Implementation Guidelines**:

1. Include one sanity check question in Information Retrieval level
2. Include one sanity check question in Pattern Recognition level
3. Ensure questions are plausible but definitively not answerable from the data
4. Use clear, unambiguous wording to avoid confusion

**Example Sanity Check Questions**:

1. **Information Retrieval Level**

```typescript
{
  type: "radio-options",
  question: "What was the exact number of casualties from the first attack?",
  options: [
    "This information is not provided in the narrative",
    "Over 1000",
    "Less than 500",
    "Exactly 750"
  ],
  answer: "This information is not provided in the narrative",
  level: "Sanity Check"
}
```

2. **Pattern Recognition Level**

```typescript
{
  type: "multiple-select",
  question: "Which of these trends can be definitively determined from the topic flow visualization?",
  options: [
    "Public opinion about the conflict",
    "Military strategy effectiveness",
    "Changes in armed conflict frequency",
    "Economic impact of the conflict"
  ],
  answer: ["Changes in armed conflict frequency"],
  level: "Sanity Check"
}
```

### Example Balanced Quiz Set with Sanity Checks

```typescript
const balancedQuizSet = {
  items: [
    // Text-Optimized (Information Retrieval)
    {
      type: "single-input",
      question: "Who announced the ceasefire agreement?",
      level: "Information Retrieval",
    },

    // Visualization-Optimized (Information Retrieval)
    {
      type: "multiple-select",
      question: "Which topics showed activity peaks in 2023?",
      level: "Information Retrieval",
    },

    // Sanity Check (Information Retrieval)
    {
      type: "radio-options",
      question: "What was the specific budget allocated for humanitarian aid?",
      options: [
        "This information is not provided",
        "$100 million",
        "$50 million",
        "$75 million",
      ],
      answer: "This information is not provided",
      level: "Sanity Check",
    },

    // Text-Optimized (Pattern Recognition)
    {
      type: "radio-options",
      question: "What sequence of events led to the ceasefire?",
      level: "Pattern Recognition",
    },

    // Visualization-Optimized (Pattern Recognition)
    {
      type: "grid-matching",
      question: "Match periods to their dominant topics",
      level: "Pattern Recognition",
    },

    // Sanity Check (Pattern Recognition)
    {
      type: "multiple-select",
      question:
        "Which of these patterns can be conclusively identified from the data?",
      options: [
        "Changes in topic frequency",
        "Individual motivations",
        "Diplomatic meeting locations",
        "Communication channels used",
      ],
      answer: ["Changes in topic frequency"],
      level: "Sanity Check",
    },
  ],
};
```

### Best Practices for Sanity Checks

1. **Question Design**

   - Use topics adjacent to but not covered in the narrative
   - Include plausible but unverifiable options
   - Focus on common assumptions users might make
   - Test for over-interpretation of visualizations

2. **Answer Validation**

   - Clear indication when information is not available
   - Explicit "not provided" or similar options
   - Avoid ambiguous or partially correct answers
   - Ensure answer can be definitively verified

3. **Distribution**

   - Include at least one sanity check per cognitive level
   - Space sanity checks throughout the quiz
   - Balance between text and visualization-related checks
   - Maintain consistent difficulty level

4. **Scoring**
   - Award points for correctly identifying missing information
   - No partial credit for sanity check questions
   - Consider sanity checks as critical validation points
   - Use results to identify over-interpretation patterns

### Example Balanced Quiz Set

```typescript
const balancedQuizSet = {
  items: [
    // Text-Optimized (Information Retrieval)
    {
      type: "single-input",
      question: "Who announced the ceasefire agreement?",
      level: "Information Retrieval",
    },

    // Visualization-Optimized (Information Retrieval)
    {
      type: "multiple-select",
      question: "Which topics showed activity peaks in 2023?",
      level: "Information Retrieval",
    },

    // Text-Optimized (Pattern Recognition)
    {
      type: "radio-options",
      question: "What sequence of events led to the ceasefire?",
      level: "Pattern Recognition",
    },

    // Visualization-Optimized (Pattern Recognition)
    {
      type: "grid-matching",
      question: "Match periods to their dominant topics",
      level: "Pattern Recognition",
    },
  ],
};
```

### Evaluation Metrics

1. **Interface-Specific Performance**

   - Compare accuracy rates between interfaces
   - Measure completion times
   - Track user interaction patterns

2. **Task Type Analysis**

   - Compare performance on text vs. visual tasks
   - Identify interface-specific advantages
   - Measure learning effects

3. **User Experience Metrics**
   - Track interface preference
   - Measure cognitive load
   - Record user confidence levels
