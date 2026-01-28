import type { DayData, ViralEvent, ContentType } from '../types';

// Helper to generate consistent IDs
const generateId = (prefix: string, index: number) => `${prefix}-${index}`;

// Sample viral events for different dates
const sampleEvents: Record<string, ViralEvent[]> = {
  '2025-01-27': [
    {
      id: '1',
      title: 'AI Breakthrough Announcement',
      summary: 'Major tech company reveals next-gen AI model that can understand context better than ever before. Twitter erupts with takes on the future of work.',
      postCount: 2450000,
      hashtag: '#AIBreakthrough',
      type: 'news',
      trendingRank: 1
    },
    {
      id: '2',
      title: 'Celebrity Meme Goes Viral',
      summary: 'Unexpected celebrity moment captured on camera becomes the meme of the day. Everyone is using the new reaction image format.',
      postCount: 1800000,
      hashtag: '#CelebrityMeme',
      type: 'meme',
      trendingRank: 2
    },
    {
      id: '3',
      title: 'Viral Video Challenge',
      summary: 'New dance challenge takes over TikTok and Twitter. Millions attempting the complicated choreography.',
      postCount: 1200000,
      hashtag: '#DanceChallenge',
      type: 'video',
      trendingRank: 3
    },
    {
      id: '4',
      title: 'Political Tweet Thread',
      summary: 'Politician posts 50-tweet thread that everyone is talking about. Debates raging across the platform.',
      postCount: 980000,
      type: 'tweet',
      trendingRank: 4
    },
    {
      id: '5',
      title: 'Tech Product Launch Drama',
      summary: 'New gadget announcement receives mixed reactions. Fans and critics going back and forth.',
      postCount: 750000,
      hashtag: '#TechDrama',
      type: 'news',
      trendingRank: 5
    }
  ],
  '2025-01-26': [
    {
      id: '6',
      title: 'Sports Upset of the Year',
      summary: 'Underdog team beats reigning champions in stunning victory. Sports Twitter losing their minds.',
      postCount: 3200000,
      hashtag: '#SportsUpset',
      type: 'news',
      trendingRank: 1
    },
    {
      id: '7',
      title: 'Movie Trailer Drops',
      summary: 'Highly anticipated sequel trailer releases. Fans analyzing every frame for Easter eggs.',
      postCount: 2100000,
      hashtag: '#MovieTrailer',
      type: 'video',
      trendingRank: 2
    }
  ],
  '2025-01-25': [
    {
      id: '8',
      title: 'Viral Cooking Hack',
      summary: 'Simple cooking trick goes unexpectedly viral. Grocery stores report ingredient shortages.',
      postCount: 1500000,
      hashtag: '#CookingHack',
      type: 'video',
      trendingRank: 1
    }
  ],
  '2025-01-15': [
    {
      id: '9',
      title: 'Award Show Moment',
      summary: 'Unexpected on-stage moment at major awards show becomes instant meme material.',
      postCount: 4500000,
      hashtag: '#AwardShow',
      type: 'meme',
      trendingRank: 1
    },
    {
      id: '10',
      title: 'New Music Drop',
      summary: 'Popular artist surprise releases album. Fans and critics sharing hot takes.',
      postCount: 2800000,
      hashtag: '#NewMusic',
      type: 'news',
      trendingRank: 2
    },
    {
      id: '11',
      title: 'Twitter Space Drama',
      summary: 'Celebrity Twitter Space goes off the rails. Screenshots being shared everywhere.',
      postCount: 1200000,
      type: 'tweet',
      trendingRank: 3
    }
  ],
  // Historical data - December 2024
  '2024-12-25': [
    {
      id: '12',
      title: 'Christmas Meme Extravaganza',
      summary: 'Holiday memes taking over the timeline. Everyone sharing their awkward family moments.',
      postCount: 5200000,
      hashtag: '#Christmas',
      type: 'meme',
      trendingRank: 1
    },
    {
      id: '13',
      title: 'Holiday Shopping Fails',
      summary: 'People sharing their last-minute gift disasters. Procrastination content at its finest.',
      postCount: 1800000,
      hashtag: '#ShoppingFail',
      type: 'tweet',
      trendingRank: 2
    }
  ],
  '2024-12-31': [
    {
      id: '14',
      title: 'New Year Reflections',
      summary: 'Year-end posts dominating the feed. Best and worst of 2024 being discussed everywhere.',
      postCount: 8900000,
      hashtag: '#NewYear',
      type: 'trend',
      trendingRank: 1
    }
  ],
  // Historical data - November 2024
  '2024-11-05': [
    {
      id: '15',
      title: 'Election Night Coverage',
      summary: 'Historic election day. Twitter becomes the primary source for real-time updates and reactions.',
      postCount: 15000000,
      hashtag: '#Election2024',
      type: 'news',
      trendingRank: 1
    }
  ],
  // Historical data - 2024 viral moments
  '2024-10-15': [
    {
      id: '16',
      title: 'Viral Optical Illusion',
      summary: 'New optical illusion breaks the internet. People divided on what they see.',
      postCount: 3200000,
      hashtag: '#OpticalIllusion',
      type: 'meme',
      trendingRank: 1
    }
  ],
  '2024-09-20': [
    {
      id: '17',
      title: 'Celebrity Breakup News',
      summary: 'High-profile split announced. Fans choosing sides and analyzing relationship timeline.',
      postCount: 6800000,
      hashtag: '#CelebrityNews',
      type: 'news',
      trendingRank: 1
    }
  ],
  '2024-08-08': [
    {
      id: '18',
      title: 'Olympic Meme Moment',
      summary: 'Athlete reaction becomes the meme of the games. Everyone using the GIF.',
      postCount: 4100000,
      hashtag: '#Olympics',
      type: 'meme',
      trendingRank: 1
    },
    {
      id: '19',
      title: 'Record Breaking Performance',
      summary: 'Historic athletic achievement witnessed by millions. World record shattered.',
      postCount: 2900000,
      hashtag: '#WorldRecord',
      type: 'news',
      trendingRank: 2
    }
  ],
  // Historical data - 2023 moments
  '2023-12-01': [
    {
      id: '20',
      title: 'Viral Cat Video',
      summary: 'Unexpected cat behavior captivates the internet. The new grumpy cat emerges.',
      postCount: 2200000,
      hashtag: '#CatVideo',
      type: 'video',
      trendingRank: 1
    }
  ],
  '2023-06-15': [
    {
      id: '21',
      title: 'Tech CEO Controversy',
      summary: 'Major tech figure makes controversial statement. Tech Twitter in heated debate.',
      postCount: 5400000,
      hashtag: '#TechNews',
      type: 'news',
      trendingRank: 1
    },
    {
      id: '22',
      title: 'Startup Drama Unfolds',
      summary: 'Company implosion documented in real-time on Twitter. Silicon Valley watching.',
      postCount: 1800000,
      hashtag: '#StartupDrama',
      type: 'tweet',
      trendingRank: 2
    }
  ],
  '2023-03-10': [
    {
      id: '23',
      title: 'Banking Crisis Discussion',
      summary: 'Major financial news breaking. Everyone suddenly an expert on banking regulations.',
      postCount: 7200000,
      hashtag: '#BankingCrisis',
      type: 'news',
      trendingRank: 1
    }
  ],
  // 2022 moments
  '2022-11-15': [
    {
      id: '24',
      title: 'Crypto Crash Commentary',
      summary: 'Major cryptocurrency event shakes markets. Twitter reacts to the volatility.',
      postCount: 8900000,
      hashtag: '#Crypto',
      type: 'news',
      trendingRank: 1
    }
  ],
  '2022-07-20': [
    {
      id: '25',
      title: 'Viral Food Trend',
      summary: 'Bizarre food combination goes viral. People trying it and documenting reactions.',
      postCount: 1600000,
      hashtag: '#FoodTrend',
      type: 'video',
      trendingRank: 1
    }
  ],
  // February 2025
  '2025-02-02': [
    {
      id: '26',
      title: 'Super Bowl Meme Moment',
      summary: 'Halftime show produces instant meme. The internet creates thousands of variations within hours.',
      postCount: 5200000,
      hashtag: '#SuperBowl',
      type: 'meme',
      trendingRank: 1
    },
    {
      id: '27',
      title: 'Game Day Commercials',
      summary: 'Brands release their most creative ads of the year. Twitter votes on the best and worst.',
      postCount: 2800000,
      hashtag: '#SuperBowlAds',
      type: 'video',
      trendingRank: 2
    }
  ],
  '2025-02-14': [
    {
      id: '28',
      title: 'Valentine\'s Day Trend',
      summary: 'Singles and couples share their takes on the holiday. Memes about expectations vs reality go viral.',
      postCount: 3800000,
      hashtag: '#ValentinesDay',
      type: 'trend',
      trendingRank: 1
    },
    {
      id: '29',
      title: 'Celebrity Couple Announcement',
      summary: 'Famous pair confirms relationship on social media. Fans react with excitement and memes.',
      postCount: 2100000,
      hashtag: '#NewCouple',
      type: 'news',
      trendingRank: 2
    }
  ],
  '2025-02-20': [
    {
      id: '30',
      title: 'Tech Conference Announcements',
      summary: 'Major product reveals at annual developer conference. Tech Twitter analyzes every detail.',
      postCount: 1900000,
      hashtag: '#TechConf',
      type: 'news',
      trendingRank: 1
    }
  ],
  '2025-02-28': [
    {
      id: '31',
      title: 'Viral Cat Video Compilation',
      summary: 'Compilation of the month\'s funniest cat moments gains millions of views overnight.',
      postCount: 4200000,
      hashtag: '#CatVideos',
      type: 'video',
      trendingRank: 1
    }
  ],
  // March 2025
  '2025-03-08': [
    {
      id: '32',
      title: 'International Women\'s Day',
      summary: 'Celebrations and discussions about gender equality trend globally. Powerful stories shared.',
      postCount: 6500000,
      hashtag: '#IWD2025',
      type: 'trend',
      trendingRank: 1
    }
  ],
  '2025-03-15': [
    {
      id: '33',
      title: 'March Madness Begins',
      summary: 'College basketball tournament starts. Upsets and buzzer beaters create viral moments.',
      postCount: 3200000,
      hashtag: '#MarchMadness',
      type: 'news',
      trendingRank: 1
    }
  ],
  '2025-03-22': [
    {
      id: '34',
      title: 'Viral Dance Craze',
      summary: 'New TikTok dance challenge spreads to all platforms. Everyone from celebrities to grandparents joining in.',
      postCount: 4800000,
      hashtag: '#DanceChallenge',
      type: 'video',
      trendingRank: 1
    }
  ],
  '2025-03-28': [
    {
      id: '35',
      title: 'Movie Release Weekend',
      summary: 'Blockbuster film breaks opening weekend records. Spoiler-free reactions flood the timeline.',
      postCount: 5500000,
      hashtag: '#MovieNight',
      type: 'news',
      trendingRank: 1
    }
  ],
  // April 2025
  '2025-04-01': [
    {
      id: '36',
      title: 'April Fools Pranks',
      summary: 'Brands and celebrities compete for the best April Fools jokes. Some too convincing cause chaos.',
      postCount: 4100000,
      hashtag: '#AprilFools',
      type: 'meme',
      trendingRank: 1
    }
  ],
  '2025-04-15': [
    {
      id: '37',
      title: 'Tax Day Memes',
      summary: 'Last-minute filers share their stress online. Memes about refunds and payments circulate.',
      postCount: 2400000,
      hashtag: '#TaxDay',
      type: 'meme',
      trendingRank: 1
    }
  ],
  '2025-04-22': [
    {
      id: '38',
      title: 'Earth Day Campaign',
      summary: 'Environmental awareness content goes viral. Celebrity endorsements amplify the message.',
      postCount: 1800000,
      hashtag: '#EarthDay',
      type: 'news',
      trendingRank: 1
    }
  ],
  // May 2025
  '2025-05-04': [
    {
      id: '39',
      title: 'Star Wars Day',
      summary: 'Fans celebrate with memes, cosplay, and franchise news. May the 4th be with you trends worldwide.',
      postCount: 7200000,
      hashtag: '#StarWarsDay',
      type: 'trend',
      trendingRank: 1
    }
  ],
  '2025-05-12': [
    {
      id: '40',
      title: 'Met Gala Fashion',
      summary: 'Celebrity outfits from the annual gala spark debate. Best and worst dressed lists go viral.',
      postCount: 8500000,
      hashtag: '#MetGala',
      type: 'news',
      trendingRank: 1
    }
  ],
  // June 2025
  '2025-06-01': [
    {
      id: '41',
      title: 'Pride Month Kickoff',
      summary: 'Celebrations and support for LGBTQ+ community begin. Companies launch inclusive campaigns.',
      postCount: 5600000,
      hashtag: '#PrideMonth',
      type: 'trend',
      trendingRank: 1
    }
  ],
  '2025-06-15': [
    {
      id: '42',
      title: 'E3 Gaming Announcements',
      summary: 'Major game reveals and trailers drop. Gaming community reacts with excitement and skepticism.',
      postCount: 4300000,
      hashtag: '#E32025',
      type: 'news',
      trendingRank: 1
    }
  ],
  // Future dates for 2026
  '2026-01-01': [
    {
      id: '43',
      title: 'New Year 2026',
      summary: 'Global celebrations welcome the new year. Resolutions and reflections trend worldwide.',
      postCount: 12000000,
      hashtag: '#Happy2026',
      type: 'trend',
      trendingRank: 1
    }
  ],
  '2026-02-14': [
    {
      id: '44',
      title: 'Valentine\'s 2026',
      summary: 'Annual celebration of love with viral proposals, gift ideas, and relatable single content.',
      postCount: 4500000,
      hashtag: '#Valentines2026',
      type: 'trend',
      trendingRank: 1
    }
  ],
  '2026-03-17': [
    {
      id: '45',
      title: 'St. Patrick\'s Day',
      summary: 'Green everything and Irish celebrations. Parades and party photos flood social media.',
      postCount: 3200000,
      hashtag: '#StPatricksDay',
      type: 'meme',
      trendingRank: 1
    }
  ]
};

// Generate a DayData object from events
const createDayData = (dateStr: string, events: ViralEvent[]): DayData => {
  const sortedEvents = events.sort((a, b) => a.trendingRank - b.trendingRank);
  return {
    date: dateStr,
    events: sortedEvents,
    hasViralContent: events.length > 0,
    topHashtag: sortedEvents[0]?.hashtag
  };
};

// Build the full mock database
export const viralData: Record<string, DayData> = {};

// Add sample events
Object.entries(sampleEvents).forEach(([date, events]) => {
  viralData[date] = createDayData(date, events);
});

// Generate some random data for other dates to make the calendar interesting
const generateRandomEvents = (dateStr: string): ViralEvent[] => {
  const types: ContentType[] = ['tweet', 'news', 'meme', 'video', 'trend'];
  const topics = [
    'Celebrity News', 'Tech Launch', 'Sports Update', 'Politics', 'Entertainment',
    'Viral Challenge', 'Meme Format', 'Breaking News', 'Internet Drama', 'Pop Culture'
  ];
  
  const count = Math.floor(Math.random() * 4) + 1; // 1-4 events
  const events: ViralEvent[] = [];
  
  for (let i = 0; i < count; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    events.push({
      id: generateId(dateStr, i),
      title: `${topic} Trend`,
      summary: `A significant ${type} related to ${topic.toLowerCase()} gained traction on this day.`,
      postCount: Math.floor(Math.random() * 1000000) + 100000,
      hashtag: `#${topic.replace(' ', '')}`,
      type,
      trendingRank: i + 1
    });
  }
  
  return events;
};

// Fill in some additional random dates for demo purposes
const additionalDates = [
  '2025-01-01', '2025-01-02', '2025-01-05', '2025-01-10',
  '2024-12-10', '2024-12-15', '2024-12-20',
  '2024-11-10', '2024-11-15', '2024-11-20', '2024-11-25',
  '2024-10-01', '2024-10-10', '2024-10-20',
  '2024-09-01', '2024-09-10', '2024-09-15', '2024-09-30',
  '2024-08-01', '2024-08-15', '2024-08-25',
  '2023-12-15', '2023-12-25',
  '2023-11-11', '2023-11-22',
  '2023-10-05', '2023-10-31',
  '2023-09-09', '2023-09-19',
  '2023-08-08', '2023-08-18',
  '2023-07-04', '2023-07-14',
  '2023-05-05', '2023-05-15',
  '2023-04-01', '2023-04-15',
  '2023-02-14', '2023-02-28',
  '2022-12-25', '2022-12-31',
  '2022-10-31', '2022-10-15'
];

additionalDates.forEach(date => {
  if (!viralData[date]) {
    viralData[date] = createDayData(date, generateRandomEvents(date));
  }
});

// Helper function to get data for a specific date
export const getDayData = (dateStr: string): DayData | undefined => {
  return viralData[dateStr];
};

// Helper to get all dates with viral content
export const getAllViralDates = (): string[] => {
  return Object.keys(viralData);
};

// Helper to format post count
export const formatPostCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M posts`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K posts`;
  }
  return `${count} posts`;
};
