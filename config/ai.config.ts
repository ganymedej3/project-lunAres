export interface AIConfig {
    api: {
      baseUrl: string;
      endpoints: {
        generate: string;
        //embeddings: string;
      };
    };
    model: {
      name: string;
      parameters: {
        //temperature: number;
        //maxTokens: number;
        //topP: number;
        //frequencyPenalty: number;
        //presencePenalty: number;
        chunkSize: number;
        promptTimeout: number;
      };
    };
    prompts: {
      
    };
  
    retry: {
      attempts: number;
      backoff: {
        initial: number;
        multiplier: number;
        maxDelay: number;
      };
    };
    // ...
  }
  
  export const AI_CONFIG: AIConfig = {
    api: {
      baseUrl: "http://localhost:11434",
      endpoints: {
        generate: "/api/generate"
        //embeddings: "/api/embeddings",
      },
    },
    model: {
      name: "mistral:7b-instruct",
      parameters: {
        chunkSize: 6000,
        promptTimeout: 60000
      },
    },
    prompts: {
  
    },
    // ...
    retry: {
      attempts: 3,
      backoff: {
        initial: 1000,
        multiplier: 1.5,
        maxDelay: 10000,
      },
    },
  };