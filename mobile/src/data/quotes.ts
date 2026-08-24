export interface Quote {
  id: string;
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  {
    id: '1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
  {
    id: '2',
    text: 'In the middle of every difficulty lies opportunity.',
    author: 'Albert Einstein',
  },
  {
    id: '3',
    text: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
  },
  {
    id: '4',
    text: "Life is what happens when you're busy making other plans.",
    author: 'John Lennon',
  },
  {
    id: '5',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
  {
    id: '6',
    text: 'Spread love everywhere you go. Let no one ever come to you without leaving happier.',
    author: 'Mother Teresa',
  },
  {
    id: '7',
    text: 'When you reach the end of your rope, tie a knot in it and hang on.',
    author: 'Franklin D. Roosevelt',
  },
  {
    id: '8',
    text: 'Always remember that you are absolutely unique. Just like everyone else.',
    author: 'Margaret Mead',
  },
  {
    id: '9',
    text: 'Do not go where the path may lead, go instead where there is no path and leave a trail.',
    author: 'Ralph Waldo Emerson',
  },
  {
    id: '10',
    text: 'You will face many defeats in life, but never let yourself be defeated.',
    author: 'Maya Angelou',
  },
  {
    id: '11',
    text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
    author: 'Nelson Mandela',
  },
  {
    id: '12',
    text: "In the end, it's not the years in your life that count. It's the life in your years.",
    author: 'Abraham Lincoln',
  },
  {
    id: '13',
    text: 'Never let the fear of striking out keep you from playing the game.',
    author: 'Babe Ruth',
  },
  {
    id: '14',
    text: 'Life is either a daring adventure or nothing at all.',
    author: 'Helen Keller',
  },
  {
    id: '15',
    text: "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    author: 'Thomas A. Edison',
  },
  {
    id: '16',
    text: 'You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.',
    author: 'Dr. Seuss',
  },
  {
    id: '17',
    text: 'If life were predictable it would cease to be life, and be without flavor.',
    author: 'Eleanor Roosevelt',
  },
  {
    id: '18',
    text: "If you look at what you have in life, you'll always have more.",
    author: 'Oprah Winfrey',
  },
  {
    id: '19',
    text: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
    author: 'James Cameron',
  },
  {
    id: '20',
    text: 'Life is not measured by the number of breaths we take, but by the moments that take our breath away.',
    author: 'Maya Angelou',
  },
  {
    id: '21',
    text: 'If you want to live a happy life, tie it to a goal, not to people or things.',
    author: 'Albert Einstein',
  },
  {
    id: '22',
    text: 'Never let the fear of striking out stop you from playing the game.',
    author: 'Babe Ruth',
  },
  {
    id: '23',
    text: "Money and success don't change people; they merely amplify what is already there.",
    author: 'Will Smith',
  },
  {
    id: '24',
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: 'Steve Jobs',
  },
  {
    id: '25',
    text: 'Not how long, but how well you have lived is the main thing.',
    author: 'Seneca',
  },
  {
    id: '26',
    text: 'If life is a game, these are the rules.',
    author: 'Cherie Carter-Scott',
  },
  {
    id: '27',
    text: 'You only live once, but if you do it right, once is enough.',
    author: 'Mae West',
  },
  {
    id: '28',
    text: 'The purpose of our lives is to be happy.',
    author: 'Dalai Lama',
  },
  {
    id: '29',
    text: 'Get busy living or get busy dying.',
    author: 'Stephen King',
  },
  {
    id: '30',
    text: 'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.',
    author: 'Ralph Waldo Emerson',
  },
  {
    id: '31',
    text: 'It is not length of life, but depth of life.',
    author: 'Ralph Waldo Emerson',
  },
];

/** Pick today's quote deterministically by day-of-year mod quotes length */
export function getTodayQuote(): Quote {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length]!;
}
