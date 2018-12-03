interface State {
  Next?: string;
  End?: boolean;
}

interface SM {
  StartAt: string;
  States: State[];
}

export interface ParseFunction {
  (fileText: string): SM;
}
