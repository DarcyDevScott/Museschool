/* Mendday — onboarding quiz definition.
 *
 * Question types:
 *   text    free text (opt.placeholder, opt.optional)
 *   single  one choice from opt.options [{v,label,note?}]
 *   multi   many choices, opt.max caps the selection
 *   scale   1..5 agreement. opt.dim maps it to a profile dimension.
 *           opt.reverse means agreeing scores LOW on that dimension.
 *
 * `when` gates a section on earlier answers.
 */
(function (MS) {
  'use strict';

  // Agreement labels shared by every scale question.
  var AGREE = ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Always'];

  function scale(id, dim, text, reverse) {
    return { id: id, type: 'scale', text: text, dim: dim, reverse: !!reverse, labels: AGREE };
  }

  var GOALS = [
    { v: 'relationship', label: 'Repair or rebuild a relationship', note: 'Partner, ex-partner, or someone close' },
    { v: 'partnership', label: 'Being a better partner day to day', note: 'The ordinary skills, not the crisis ones' },
    { v: 'worth', label: 'Confidence and self-worth', note: 'Liking who you are without needing proof' },
    { v: 'regulation', label: 'Emotional steadiness', note: 'Feeling things without being run by them' },
    { v: 'consistency', label: 'Discipline and follow-through', note: 'Doing what you said you would' },
    { v: 'vitality', label: 'Body, sleep and energy', note: 'The physical base underneath everything' },
    { v: 'purpose', label: 'Direction and purpose', note: 'Knowing what you are building' },
    { v: 'connection', label: 'Friendship and community', note: 'A life that is not one person wide' },
    { v: 'presence', label: 'Presence and attention', note: 'Actually being where you are' }
  ];

  MS.GOALS = GOALS;

  MS.QUIZ = [
    {
      id: 'start',
      title: 'Where you are',
      blurb: 'No right answers here. The plan is only as good as how honest this is — and nothing you type leaves this device.',
      questions: [
        { id: 'name', type: 'text', short: true, text: 'What should this call you?', placeholder: 'First name' },
        { id: 'ageRange', type: 'single', text: 'How old are you?', options: [
          { v: 'u25', label: 'Under 25' }, { v: '25_34', label: '25–34' },
          { v: '35_44', label: '35–44' }, { v: '45_54', label: '45–54' },
          { v: '55p', label: '55 or older' }
        ]},
        { id: 'season', type: 'single', text: 'Which best describes the season you are in?', options: [
          { v: 'crisis', label: 'Something just broke', note: 'Recent, raw, still loud' },
          { v: 'drift', label: 'Slow drift', note: 'Nothing exploded, but I have lost the thread' },
          { v: 'stuck', label: 'Stuck in a loop', note: 'Same patterns, same outcomes' },
          { v: 'rebuild', label: 'Rebuilding', note: 'Past the worst, putting it back together' },
          { v: 'sharpen', label: 'Basically okay, want more', note: 'Stable, aiming higher' }
        ]},
        { id: 'prompt', type: 'single', text: 'What brought you here right now?', options: [
          { v: 'loss', label: 'I lost someone or something that mattered' },
          { v: 'pattern', label: 'I keep repeating something I hate' },
          { v: 'told', label: 'Someone told me the truth about myself' },
          { v: 'flat', label: 'I feel flat and I want to feel something' },
          { v: 'ready', label: 'Nothing is wrong. I just want to be better' }
        ]},
        { id: 'duration', type: 'single', text: 'How long has this been going on?', options: [
          { v: 'weeks', label: 'A few weeks' }, { v: 'months', label: 'A few months' },
          { v: 'year', label: 'About a year' }, { v: 'years', label: 'Years' },
          { v: 'always', label: 'As long as I can remember' }
        ]},
        { id: 'kids', type: 'single', text: 'Do you have children?', options: [
          { v: 'none', label: 'No' },
          { v: '1', label: 'One' },
          { v: '2', label: 'Two' },
          { v: '3', label: 'Three or more' }
        ]},
        { id: 'tried', type: 'single', text: 'Have you tried to work on this before?', options: [
          { v: 'never', label: 'Not really' },
          { v: 'started', label: 'I start and stop' },
          { v: 'therapy', label: 'Yes — therapy or coaching' },
          { v: 'alone', label: 'Yes — on my own, books and videos' },
          { v: 'lots', label: 'Many times. That is part of the problem' }
        ]}
      ]
    },

    {
      id: 'want',
      title: 'What you want',
      blurb: 'Aim at something specific. Vague goals produce vague plans.',
      questions: [
        { id: 'goals', type: 'multi', max: 3, text: 'What do you want to work on? Pick up to three.', options: GOALS },
        { id: 'primaryGoal', type: 'single', text: 'If only one of those could change this year, which one?', options: GOALS },
        { id: 'evidence', type: 'multi', max: 3, text: 'Six months from now, what would tell you this actually worked?', options: [
          { v: 'calm', label: 'I stayed calm in a moment that used to wreck me' },
          { v: 'kept', label: 'I kept a promise to myself for months straight' },
          { v: 'heard', label: 'Someone told me I had changed' },
          { v: 'alone_ok', label: 'I was alone and genuinely fine' },
          { v: 'repaired', label: 'A relationship got real again' },
          { v: 'proud', label: 'I looked at my week and felt proud of it' },
          { v: 'body', label: 'I felt strong and rested in my body' }
        ]},
        { id: 'feelMore', type: 'multi', max: 3, text: 'What do you want more of?', options: [
          { v: 'steady', label: 'Steadiness' }, { v: 'warmth', label: 'Warmth' },
          { v: 'respect', label: 'Self-respect' }, { v: 'energy', label: 'Energy' },
          { v: 'clarity', label: 'Clarity' }, { v: 'courage', label: 'Courage' },
          { v: 'peace', label: 'Peace' }, { v: 'joy', label: 'Joy' }
        ]},
        { id: 'giveUp', type: 'multi', max: 3, text: 'What are you actually willing to give up to get there?', options: [
          { v: 'scroll', label: 'Hours of scrolling' },
          { v: 'drink', label: 'Drinking to take the edge off' },
          { v: 'right', label: 'Being right in arguments' },
          { v: 'sleepin', label: 'Sleeping in' },
          { v: 'venting', label: 'Venting to anyone who will listen' },
          { v: 'checking', label: 'Checking what they are doing' },
          { v: 'story', label: 'The story where I am the one who got wronged' }
        ]}
      ]
    },

    {
      id: 'regulation',
      title: 'Emotional steadiness',
      blurb: 'How you handle the moment after something lands badly.',
      questions: [
        scale('reg1', 'regulation', 'When something upsets me, I can feel it without acting on it straight away.'),
        scale('reg2', 'regulation', 'I recover from a bad moment within the same day.'),
        scale('reg3', 'regulation', 'I say things I regret when I am hurt.', true),
        scale('reg4', 'regulation', 'I can name what I am feeling while I am feeling it.'),
        scale('reg5', 'regulation', 'Small frustrations escalate fast for me.', true),
        scale('reg6', 'regulation', 'I can settle myself down without needing someone else to do it for me.')
      ]
    },

    {
      id: 'worth',
      title: 'Self-worth',
      blurb: 'What you are like with yourself when nobody is watching.',
      questions: [
        scale('wor1', 'worth', 'I like who I am when I am on my own.'),
        scale('wor2', 'worth', 'I need reassurance from others to feel okay.', true),
        scale('wor3', 'worth', 'I speak to myself the way I would speak to a friend.'),
        scale('wor4', 'worth', 'I feel like I have to earn being loved.', true),
        scale('wor5', 'worth', 'I can be alone without feeling empty.')
      ]
    },

    {
      id: 'communication',
      title: 'How you communicate',
      blurb: 'Especially under pressure, which is the only time it counts.',
      questions: [
        scale('com1', 'communication', 'I can say what I need directly, without hinting.'),
        scale('com2', 'communication', 'I shut down or go silent during conflict.', true),
        scale('com3', 'communication', 'I listen to understand rather than to reply.'),
        scale('com4', 'communication', 'I can hear criticism without defending myself.'),
        scale('com5', 'communication', 'When I apologise I name the specific thing, with no "but" attached.')
      ]
    },

    {
      id: 'ownership',
      title: 'Ownership',
      blurb: 'The uncomfortable section. Take your time.',
      questions: [
        scale('own1', 'ownership', 'I can name my part in things going wrong.'),
        scale('own2', 'ownership', 'When I am hurt, I focus on what the other person did wrong.', true),
        scale('own3', 'ownership', 'I have genuinely changed a behaviour because someone told me it hurt them.'),
        scale('own4', 'ownership', 'I make excuses for patterns I know are mine.', true),
        scale('own5', 'ownership', 'I can be wrong about something without it meaning I am a bad person.')
      ]
    },

    {
      id: 'consistency',
      title: 'Follow-through',
      blurb: 'Whether your intentions survive contact with a Tuesday.',
      questions: [
        scale('con1', 'consistency', 'I do what I said I would, even when I do not feel like it.'),
        scale('con2', 'consistency', 'I abandon things about two weeks in.', true),
        scale('con3', 'consistency', 'I have a routine I keep most days.'),
        scale('con4', 'consistency', 'I need to feel motivated before I can act.', true),
        scale('con5', 'consistency', 'I take promises to myself as seriously as promises to other people.')
      ]
    },

    {
      id: 'vitality',
      title: 'Body and energy',
      blurb: 'The physical floor everything else stands on.',
      questions: [
        scale('vit1', 'vitality', 'I sleep enough and wake up rested.'),
        scale('vit2', 'vitality', 'I move my body most days.'),
        scale('vit3', 'vitality', 'I use food, alcohol or screens to numb out.', true),
        scale('vit4', 'vitality', 'I still have energy in the evening.'),
        scale('vit5', 'vitality', 'I look after my body even when I feel low.')
      ]
    },

    {
      id: 'purpose',
      title: 'Direction',
      blurb: 'Whether your days are pointed at anything.',
      questions: [
        scale('pur1', 'purpose', 'I know what I am building toward.'),
        scale('pur2', 'purpose', 'My days are mostly reactive.', true),
        scale('pur3', 'purpose', 'I have something in my life that is mine alone.'),
        scale('pur4', 'purpose', 'I feel proud of how I spend my time.')
      ]
    },

    {
      id: 'people',
      title: 'People and presence',
      blurb: 'Your support, and whether you are actually in the room.',
      questions: [
        scale('cnn1', 'connection', 'I have people I can be honest with.'),
        scale('cnn2', 'connection', 'I reach out first.'),
        scale('cnn3', 'connection', 'My whole world revolves around one person.', true),
        scale('prs1', 'presence', 'I am fully in conversations, not half on my phone.'),
        scale('prs2', 'presence', 'My mind is somewhere else most of the day.', true),
        scale('prs3', 'presence', 'I notice small good things during an ordinary day.')
      ]
    },

    {
      id: 'attachment',
      title: 'How you are with closeness',
      blurb: 'Two things get measured here, and neither is a fault: how much you fear being left, and how much closeness itself makes you want space. Most people are somewhere on both.',
      when: function (a) {
        var g = Array.isArray(a.goals) ? a.goals : [];
        return ['relationship', 'partnership', 'connection'].some(function (k) {
          return a.primaryGoal === k || g.indexOf(k) !== -1;
        }) || (a.kids && a.kids !== 'none');
      },
      questions: [
        scale('att_a1', 'attachAnx', 'I worry that people close to me will stop caring.'),
        scale('att_a2', 'attachAnx', 'I need a fair amount of reassurance that I am wanted.'),
        scale('att_a3', 'attachAnx', 'When someone I care about goes quiet, I assume something is wrong.'),
        scale('att_a4', 'attachAnx', 'I worry I care more about them than they do about me.'),
        scale('att_v1', 'attachAvo', 'I find it hard to let someone see me struggling.'),
        scale('att_v2', 'attachAvo', 'I would rather handle things alone than lean on anyone.'),
        scale('att_v3', 'attachAvo', 'When someone gets very close, I notice myself pulling back.'),
        scale('att_v4', 'attachAvo', 'Talking about feelings with a partner is uncomfortable for me.')
      ]
    },

    {
      id: 'partnership',
      title: 'As a partner',
      blurb: 'The ordinary daily mechanics of being someone to live with. Answer about how you have been, not how you mean to be.',
      when: function (a) {
        var g = Array.isArray(a.goals) ? a.goals : [];
        return a.primaryGoal === 'relationship' || a.primaryGoal === 'partnership' ||
          g.indexOf('relationship') !== -1 || g.indexOf('partnership') !== -1 ||
          (a.kids && a.kids !== 'none');
      },
      questions: [
        scale('par1', 'partnership', 'I notice when they are reaching for my attention, even when it is a small thing.'),
        scale('par2', 'partnership', 'In a disagreement, I let their view actually change my mind.'),
        scale('par3', 'partnership', 'I go cold or end the conversation when it gets heated.', true),
        scale('par4', 'partnership', 'I go after the person rather than naming the specific thing they did.', true),
        scale('par5', 'partnership', 'After a row, I am the one who makes the first move back.'),
        scale('par6', 'partnership', 'They would say I carry my share without having to be asked.')
      ]
    },

    {
      id: 'family',
      title: 'The children',
      blurb: 'Two things get measured here: what your children see, and what having them has done to the partnership.',
      when: function (a) { return a.kids && a.kids !== 'none'; },
      questions: [
        { id: 'kidsAges', type: 'multi', max: 4, text: 'How old are they?', options: [
          { v: 'baby', label: 'Under 2' }, { v: 'toddler', label: '2 to 4' },
          { v: 'primary', label: '5 to 10' }, { v: 'teen', label: '11 to 15' },
          { v: 'older', label: '16 or older' }
        ]},
        { id: 'famSetup', type: 'single', text: 'How is parenting arranged right now?', options: [
          { v: 'together', label: 'We parent together, same house' },
          { v: 'split_amicable', label: 'Separate houses, and it works reasonably' },
          { v: 'split_tense', label: 'Separate houses, and it is tense' },
          { v: 'mostly_me', label: 'They are with me most of the time' },
          { v: 'mostly_them', label: 'They are with their other parent most of the time' }
        ]},
        { id: 'famLoad', type: 'single', text: 'Who carries the remembering — appointments, kit, forms, who needs what when?', options: [
          { v: 'me', label: 'Mostly me' },
          { v: 'them', label: 'Mostly them' },
          { v: 'even', label: 'Genuinely evenly split' },
          { v: 'unsure', label: 'I have honestly never worked it out' }
        ]},
        { id: 'famConflict', type: 'single', text: 'How much of the conflict do the children see?', options: [
          { v: 'none', label: 'None — we keep it away from them' },
          { v: 'some', label: 'Some. The tension, mostly' },
          { v: 'lots', label: 'More than I would like' },
          { v: 'repair', label: 'They see it, and they see us fix it' }
        ]},
        scale('fam1', 'partnership', 'We have time together that is not about the children or logistics.'),
        scale('fam2', 'presence', 'I get time with each child that is not admin — not lifts, meals or bedtime routine.')
      ]
    },

    {
      id: 'relationship',
      title: 'The relationship',
      blurb: 'This section is about your side of it. Not theirs, and not what they should do.',
      when: function (a) {
        return a.primaryGoal === 'relationship' ||
          (Array.isArray(a.goals) && a.goals.indexOf('relationship') !== -1);
      },
      questions: [
        { id: 'relStatus', type: 'single', text: 'Where do things stand?', options: [
          { v: 'together_strained', label: 'Together, but strained' },
          { v: 'separated', label: 'Separated or on a break' },
          { v: 'ended_recent', label: 'Ended recently' },
          { v: 'ended_long', label: 'Ended a while ago' },
          { v: 'unclear', label: 'Genuinely unclear' }
        ]},
        { id: 'relContact', type: 'single', text: 'What is contact like right now?', options: [
          { v: 'daily', label: 'We talk most days' },
          { v: 'occasional', label: 'Occasionally' },
          { v: 'logistics', label: 'Logistics only' },
          { v: 'none_mutual', label: 'None, by mutual agreement' },
          { v: 'none_theirs', label: 'None — they asked for space' },
          { v: 'none_mine', label: 'None — that was my decision' }
        ]},
        { id: 'relSpace', type: 'single', text: 'If they have asked for space, are you giving it?', options: [
          { v: 'na', label: 'They have not asked for space' },
          { v: 'yes', label: 'Yes, fully' },
          { v: 'mostly', label: 'Mostly, with slips' },
          { v: 'no', label: 'No, honestly' }
        ]},
        { id: 'relOwn', type: 'multi', max: 4, text: 'Honestly — what did you bring to the breakdown?', options: [
          { v: 'absent', label: 'I was there but not present' },
          { v: 'defensive', label: 'I got defensive instead of listening' },
          { v: 'anger', label: 'I let my temper land on them' },
          { v: 'withdraw', label: 'I withdrew and went cold' },
          { v: 'needy', label: 'I leaned on them for everything' },
          { v: 'unreliable', label: 'I did not follow through on things I promised' },
          { v: 'dishonest', label: 'I was not fully honest' },
          { v: 'contempt', label: 'I was critical or contemptuous' },
          { v: 'neglect', label: 'I stopped making effort' },
          { v: 'unsure', label: 'I genuinely do not know yet' }
        ]},
        { id: 'relAsked', type: 'text', optional: true, placeholder: 'In their words, if you can remember them',
          text: 'What did they ask you for, more than once, that you did not give?' },
        { id: 'relWant', type: 'single', text: 'What do you actually want out of this?', options: [
          { v: 'reconcile', label: 'To rebuild the relationship' },
          { v: 'ready', label: 'To become someone worth rebuilding with, whatever they decide' },
          { v: 'understand', label: 'To understand my part so I stop repeating it' },
          { v: 'closure', label: 'To let go properly' },
          { v: 'unsure', label: 'I do not know yet' }
        ]},
        { id: 'relLegacy', type: 'text', optional: true, placeholder: 'Write it plainly. You will be shown this again later.',
          text: 'If this never ends in reconciliation, what do you want to be true of you a year from now?' }
      ]
    },

    {
      id: 'patterns',
      title: 'What derails you',
      blurb: 'Plans fail in predictable places. Name yours now.',
      questions: [
        { id: 'derailers', type: 'multi', max: 3, text: 'What usually knocks you off?', options: [
          { v: 'tired', label: 'Being tired' },
          { v: 'lonely', label: 'Loneliness at night' },
          { v: 'conflict', label: 'A hard conversation' },
          { v: 'busy', label: 'A busy week at work' },
          { v: 'boredom', label: 'Boredom' },
          { v: 'setback', label: 'One missed day turning into ten' },
          { v: 'news', label: 'Hearing something about them' },
          { v: 'drink', label: 'A few drinks' }
        ]},
        { id: 'stressResponse', type: 'single', text: 'Under real stress, what do you do first?', options: [
          { v: 'fight', label: 'Push back, argue, get sharp' },
          { v: 'flee', label: 'Avoid it, distract, disappear' },
          { v: 'freeze', label: 'Go blank and do nothing' },
          { v: 'fawn', label: 'Over-apologise and try to fix it fast' },
          { v: 'fix', label: 'Go into problem-solving overdrive' }
        ]},
        { id: 'bestTime', type: 'single', text: 'When are you actually most likely to do this?', options: [
          { v: 'early', label: 'Early morning' }, { v: 'commute', label: 'Mid morning' },
          { v: 'lunch', label: 'Around midday' }, { v: 'evening', label: 'Evening' },
          { v: 'night', label: 'Late night' }
        ]},
        { id: 'minutes', type: 'single', text: 'Realistically, how long per day?', options: [
          { v: '10', label: '10 minutes', note: 'The honest floor. This still works.' },
          { v: '20', label: '20 minutes', note: 'The sweet spot for most people' },
          { v: '40', label: '40 minutes' },
          { v: '60', label: 'An hour or more' }
        ]},
        { id: 'days', type: 'single', text: 'How many days a week?', options: [
          { v: '5', label: '5 — weekdays' }, { v: '6', label: '6 — one day off' },
          { v: '7', label: '7 — every day' }
        ]},
        { id: 'hardest', type: 'single', text: 'What will be the hardest part of this for you?', options: [
          { v: 'starting', label: 'Starting at all' },
          { v: 'continuing', label: 'Continuing past week two' },
          { v: 'honesty', label: 'Being honest in the written parts' },
          { v: 'patience', label: 'Waiting for it to show results' },
          { v: 'alone', label: 'Doing it without anyone noticing' }
        ]}
      ]
    }
  ];

  MS.DIMENSIONS = {
    regulation:    { label: 'Emotional steadiness', short: 'Steadiness' },
    worth:         { label: 'Self-worth',           short: 'Self-worth' },
    communication: { label: 'Communication',        short: 'Communication' },
    ownership:     { label: 'Ownership',            short: 'Ownership' },
    consistency:   { label: 'Follow-through',       short: 'Follow-through' },
    vitality:      { label: 'Body and energy',      short: 'Energy' },
    purpose:       { label: 'Direction',            short: 'Direction' },
    connection:    { label: 'Connection',           short: 'Connection' },
    presence:      { label: 'Presence',             short: 'Presence' },
    partnership:   { label: 'Partnership',          short: 'Partnership' }
  };

  MS.DIM_KEYS = Object.keys(MS.DIMENSIONS);
})(window.MS = window.MS || {});
