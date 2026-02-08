export interface Link {
  title: string;
  url: string;
  icon?: string;
}

export interface Section {
  title: string;
  links: Link[];
}

export const sections: Section[] = [
  {
    title: 'Core',
    links: [
      {
        title: 'OpenClaw HQ',
        url: 'https://www.notion.so/OpenClaw-HQ-301407c4e5088140be14cea0c08ab96f',
        icon: '🏠',
      },
      {
        title: 'Cheap & Stable Principles',
        url: 'https://www.notion.so/OpenClaw-Cheap-Stable-Operating-Principles-301407c4e50881238d3bf2f6fd586cb6',
        icon: '📐',
      },
    ],
  },
  {
    title: 'Daily',
    links: [
      {
        title: 'Journal 2026-02-08',
        url: 'https://www.notion.so/Journal-2026-02-08-301407c4e50881bea3a3cb6bc61b0773',
        icon: '📓',
      },
    ],
  },
  {
    title: 'Work',
    links: [
      {
        title: 'Backlog',
        url: 'https://www.notion.so/6557eddea1674c22aaba7e3aad343300',
        icon: '📋',
      },
      {
        title: 'Agent Log',
        url: 'https://www.notion.so/7a88a4cbdd1340c9a7d3560c11cac98b',
        icon: '🤖',
      },
    ],
  },
];
