/* Museschool — the four-phase arc and the milestone language for each dimension. */
(function (MS) {
  'use strict';

  MS.PHASES = [
    { n: 1, name: 'Stabilise', weeks: [1, 3],
      line: 'Stop the bleeding. Get the floor solid.',
      body: 'You cannot build anything on a nervous system that is running hot and a body that is running empty. The first three weeks are deliberately unambitious: sleep, daylight, movement, and learning to feel something without immediately acting on it. If you skip this because it looks too basic, everything after it will wobble.',
      base: ['regulation', 'vitality'] },

    { n: 2, name: 'Look straight at it', weeks: [4, 6],
      line: 'The honest part. Your patterns, in writing.',
      body: 'Now the work turns inward and gets uncomfortable. This phase is about seeing your own patterns clearly enough to name them without either excusing them or drowning in them. Most people quit somewhere in here. The tasks are short on purpose — the difficulty is not the time, it is the honesty.',
      base: ['ownership', 'worth'] },

    { n: 3, name: 'Show up', weeks: [7, 9],
      line: 'Take it out of your head and into rooms with people in them.',
      body: 'Insight that never leaves your journal is not change. This phase moves everything outward: saying the direct thing, hearing criticism without armour, repairing what went quiet, being present with people who are actually in front of you. This is where other people start to notice, which is not the point but is a reasonable side effect.',
      base: ['communication', 'connection', 'presence'] },

    { n: 4, name: 'Make it yours', weeks: [10, 12],
      line: 'Turn twelve weeks of effort into a way you live.',
      body: 'The last phase is about permanence. What survives after the plan ends, what you do the next time it all goes badly, and what you are building that belongs to you regardless of how anything else resolves. You finish with a shorter list than you started with, and you keep it.',
      base: ['purpose', 'consistency'] }
  ];

  /* Milestones, phrased per dimension. Index 0-3 maps to phase 1-4. */
  MS.MILESTONES = {
    regulation: [
      'Name what you are feeling, out loud, three times a day without flinching',
      'Go a full week without sending anything written while activated',
      'Get through one genuinely hard conversation without your voice changing',
      'Have a written plan for your next bad week, made while calm'
    ],
    worth: [
      'One kept promise to yourself every day for seven days straight',
      'Spend an evening alone without reaching for company or a screen',
      'Accept a compliment, and hold one standard, without apologising',
      'Be able to say what you will and will not accept, without a speech'
    ],
    communication: [
      'Say one thing plainly each day instead of hinting at it',
      'Write the raw version and send the clean version, three times',
      'Take one piece of criticism with nothing but "tell me more"',
      'Say no once, warmly, without five reasons attached'
    ],
    ownership: [
      'Write what happened with your part in it, unedited',
      'Write the other person\'s side in their voice, sympathetically',
      'Change one named behaviour without announcing that you changed it',
      'Be able to state your part in one sentence, without qualifying it'
    ],
    consistency: [
      'Seven days of the anchor, at the same time, no exceptions',
      'Miss a day and come back the next — proving the bounce works',
      'A written if-then for every derailer you named in the quiz',
      'Three habits you keep with no end date and no tracking'
    ],
    vitality: [
      'Same wake time seven days running, daylight within the hour',
      'Movement most days and one honest look at the numbing habit',
      'A wind-down that does not involve a screen, five nights of seven',
      'One measurable thing that is better than it was in week one'
    ],
    purpose: [
      'An honest audit of where your hours actually go',
      'One page describing an ordinary day in the life you want',
      'One concrete step nobody asked you to take',
      'Something of yours that another person has now seen'
    ],
    connection: [
      'Your people, mapped — who you could call at 2am',
      'One honest sentence about how you are, to someone new',
      'A real plan with a date, and something useful done for someone',
      'One place you show up in person, on repeat'
    ],
    presence: [
      'One meal a day with nothing else happening',
      'Ten minutes walking with no input, three times',
      'One hour of single-tasking, and the phone down when people speak',
      'Three specific ordinary good things, noticed daily'
    ]
  };

  /* What a low score in each dimension actually costs you, in plain terms. */
  MS.DIM_READ = {
    regulation: 'The gap between feeling something and doing something about it is short. That gap is trainable, and widening it changes more than almost anything else on this list.',
    worth: 'Your sense of being alright depends too much on somebody else confirming it. That makes you harder to be close to, not easier.',
    communication: 'You are asking people to guess. Some of what you read as them not caring is them not knowing.',
    ownership: 'You can describe what happened, but your part in it keeps arriving with an explanation attached. Nothing changes until it arrives without one.',
    consistency: 'Your intentions are good and your follow-through is not, which is its own slow erosion of self-trust.',
    vitality: 'You are trying to do emotional work on an empty tank. Sleep, light and movement are not adjacent to this — they are underneath it.',
    purpose: 'Your days are mostly responses to other people. There is nothing that is yours, and that absence gets filled by whatever is loudest.',
    connection: 'Too much of your life runs through too few people. That is a lot of weight on one rope.',
    presence: 'You are physically in your life and mentally somewhere else, which is why so much of it feels like it is happening at a distance.'
  };

  MS.DIM_STRENGTH = {
    regulation: 'You can hold a feeling without discharging it. Lean on that when the rest gets hard.',
    worth: 'You have a floor of self-respect that does not depend on the day going well. That is the thing most people are missing.',
    communication: 'You can say things clearly. That is rarer than you think, and it is your fastest route to repair.',
    ownership: 'You can look at your own part without falling apart. Everything else on this list gets easier from there.',
    consistency: 'You do what you said you would. Point that at the right target and this plan is largely already solved.',
    vitality: 'Your body is in good order, so the hard emotional work has somewhere solid to happen.',
    purpose: 'You know what you are building. That gives you somewhere to stand while the rest moves.',
    connection: 'You have real people around you. Use them — most of this goes faster witnessed.',
    presence: 'You can actually be where you are. That is the raw material for every relationship skill here.'
  };
})(window.MS = window.MS || {});
