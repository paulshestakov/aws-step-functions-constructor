export interface Step {
  stepName: string;
  stepDescription: StepDescription;
}

export interface StepDescription {
  Next: string;
  Type: string;
  Choices?: Choice[];
  Default: string;
  End: boolean;
}

export interface Choice {
  Next: string;
}
