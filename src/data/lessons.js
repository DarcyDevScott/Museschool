/* Museschool — the reading.
 *
 * Short lessons drawn from mainstream couples and family research, mostly
 * John Gottman's observational work and Sue Johnson's Emotionally Focused
 * Therapy, plus the parenting literature on conflict and repair.
 *
 * Tracks decide who sees what: 'partner', 'parenting', 'self'.
 * Order matters — these build on each other, so they are delivered in
 * sequence rather than shuffled.
 *
 * This is educational material, not therapy, and couples work genuinely
 * needs both people. What is here is the half that is yours.
 */
(function (MS) {
  'use strict';

  MS.LESSONS = [
    {
      id: 'l_bids', track: 'partner', min: 4,
      title: 'The smallest thing that matters most',
      dek: 'Bids for connection, and the three things you can do with one.',
      body: [
        'A bid is any small reach for attention. "Look at this." A sigh. A hand on your shoulder. A comment about something on the news that you have no interest in. They happen dozens of times a day and almost all of them look like nothing.',
        'There are three things you can do with a bid. Turn toward it — look up, answer, engage. Turn away from it — miss it, stay on your phone, say nothing. Or turn against it — snap, dismiss, make it a nuisance.',
        'In Gottman\'s observational work, how often partners turn toward each other\'s bids was one of the strongest markers separating couples who lasted from those who did not. Not how they argued. Not how compatible they were. The ordinary, boring turning-toward.',
        'The reason it matters so much is that it accumulates invisibly. Nobody leaves because of one ignored comment. They leave after several thousand of them, at which point the story they tell is "we drifted apart", which is the phrase people use when they cannot see what actually happened.'
      ],
      practice: 'Today, catch one bid you would normally have missed and turn toward it properly. Put the phone down first.'
    },
    {
      id: 'l_horsemen', track: 'partner', min: 5,
      title: 'The four that do the damage',
      dek: 'Criticism, contempt, defensiveness, stonewalling — and what goes in their place.',
      body: [
        'Gottman named four patterns that show up reliably when a relationship is in trouble. Most people have a default one. Knowing yours is more useful than knowing all four.',
        '<strong>Criticism</strong> attacks the person rather than the problem. "The bins did not go out" is a complaint. "You never think about anyone but yourself" is a criticism. The first can be solved; the second puts them on trial. The replacement is a complaint plus a request.',
        '<strong>Contempt</strong> is criticism from above — sarcasm, eye-rolling, mockery, the tone. It communicates disgust, and it is the single most corrosive of the four. There is no gentle version of it. The replacement is not politeness, it is deliberately building back respect you have let slide.',
        '<strong>Defensiveness</strong> is meeting a complaint with your innocence. "I did do it, you just did not notice." It reads as refusing to hear them. The replacement is accepting some part of it, even a small part, before anything else.',
        '<strong>Stonewalling</strong> is going blank, leaving, shutting down. It is usually not contempt but flooding — your body has hit an overload and stopped processing. The replacement is not pushing through; it is saying "I need twenty minutes" and actually coming back.'
      ],
      practice: 'Work out which of the four is yours. Look at your last three arguments and name the specific move — the tone, the phrase, the walking out.'
    },
    {
      id: 'l_flood', track: 'partner', min: 4,
      title: 'Why you go blank',
      dek: 'Flooding is physiological, not a character flaw — but the way out is a specific one.',
      body: [
        'When conflict escalates past a certain point, your heart rate climbs and your body switches into threat mode. Above roughly 100 beats a minute, the parts of you that do nuance, memory and generosity are substantially offline. You are not being difficult; you have stopped being able to process.',
        'This is why arguments past a certain heat go nowhere. Neither of you is really there. Anything agreed in that state tends not to survive the night.',
        'The way out has two halves, and most people only do the first. The first half is stopping: "I am flooded, I need twenty minutes." The second half is what you do with the twenty minutes — and if you spend it rehearsing your case, you will come back more flooded than you left.',
        'Self-soothing means genuinely dropping the arousal: walk, breathe out longer than you breathe in, do something with your hands. Twenty minutes is roughly the physiological minimum. And you must come back, at the time you said. A break that becomes an exit is just stonewalling with a better excuse.'
      ],
      practice: 'Agree a word or phrase that either of you can use to call a break, and agree the return time in advance so it is not negotiated mid-row.'
    },
    {
      id: 'l_cycle', track: 'partner', min: 5,
      title: 'The loop you are both stuck in',
      dek: 'One presses, one retreats, and each move causes the other.',
      body: [
        'Most couples in difficulty have one recurring pattern. The commonest is pursue and withdraw: one person presses for contact, resolution, an answer. The other retreats to stop the situation escalating. Each move makes the other more likely.',
        'The pursuer is not needy and the withdrawer is not cold. From inside, the pursuer feels they are fighting for the relationship and the withdrawer feels they are protecting it. Both are true, which is exactly why it does not resolve.',
        'This is the central insight of Emotionally Focused Therapy: the problem is not either person, it is the loop the two of you make together. Once you can name it, you can both stand outside it and look at it instead of being inside it blaming each other.',
        'Naming it sounds like: "when I push, you go quiet, and when you go quiet I push harder, and we both end up further away." No fault in the sentence. That sentence, said calmly, does more than an hour of arguing about who started it.'
      ],
      practice: 'Write your loop in one sentence with no blame in it. Just the mechanism. If you are able to, say it to them.'
    },
    {
      id: 'l_under', track: 'partner', min: 4,
      title: 'What the argument is actually about',
      dek: 'It is rarely the dishwasher.',
      body: [
        'Underneath most recurring fights sits one question, and it is almost never the surface topic. The question is some version of: are you there for me? Do I matter to you? If I need you, will you come?',
        'This is why arguments about small things get disproportionately hot. The dishwasher is not worth that much feeling. What is worth it is what the dishwasher has come to mean — that you did not think of me, that I am doing this alone, that I am not important enough to remember.',
        'When you answer the surface question, you win the point and lose the room. When you answer the underlying one, the surface question often stops mattering.',
        'Answering it sounds unremarkable: "you matter to me and I have been showing you the opposite." It is much harder to say than to read, because it means dropping the case you were building.'
      ],
      practice: 'Take your most recent argument. Write the surface topic, then write the question underneath it. Answer that one instead.'
    },
    {
      id: 'l_repair', track: 'partner', min: 4,
      title: 'Repair beats never breaking',
      dek: 'Every couple fights. The difference is what happens next.',
      body: [
        'Happy couples are not the ones who avoid conflict. They are the ones who get back faster. A repair attempt is anything that tries to lower the temperature while it is still hot: a clumsy joke, a hand on the arm, "hang on, I am doing the thing again", "can we start that bit over".',
        'Repair attempts are usually inelegant, and that does not matter. What matters is whether one gets made, and whether the other person lets it land. A rejected repair attempt is one of the more reliable danger signs there is.',
        'This is worth knowing if you are the one who is normally right. Accepting a badly-timed joke as a peace offering, when you had a much better point to make, is not losing. It is the mechanism by which the relationship keeps working.',
        'The other half is speed. Something repaired within the hour costs a fraction of the same thing repaired three days later, after both of you have spent three days making a case.'
      ],
      practice: 'Make one repair attempt today, however clumsy. And if one comes your way, take it, even if you had a better point ready.'
    },
    {
      id: 'l_ratio', track: 'partner', min: 3,
      title: 'Five to one',
      dek: 'The ordinary hours matter more than the arguments.',
      body: [
        'One of Gottman\'s better-known findings is that stable couples run at roughly five positive interactions for every negative one — not during conflict, across ordinary life. Thanks, laughs, touches, questions, small kindnesses against the criticisms, snaps and eye-rolls.',
        'The useful implication is counterintuitive. If your ratio is underwater, the fix is not primarily to argue less. Arguments are expensive but rare. The deficit is usually in the ordinary hours, where the positives have quietly stopped happening.',
        'This is also why "we do not even fight any more" is not the reassurance people think it is. A relationship can be well above water on conflict and starving on everything else.'
      ],
      practice: 'Tally a single day: positives and negatives. Do not change anything yet, just get the number.'
    },
    {
      id: 'l_influence', track: 'partner', min: 3,
      title: 'Letting them change your mind',
      dek: 'Accepting influence, and why refusing it is so costly.',
      body: [
        'Accepting influence means letting your partner\'s opinion actually alter your decision. Not conceding to end an argument, not agreeing while privately keeping score — genuinely updating.',
        'In Gottman\'s research, an unwillingness to accept influence was strongly associated with relationships failing. It communicates something corrosive over time: your view is information, mine is the decision.',
        'It shows up in small places. Which route to take. How to handle something with the children. Whether the thing they are worried about is worth worrying about. Each individual instance is trivial, which is why the pattern is invisible until it has done years of damage.',
        'Doing it out loud is what makes it count: "you were right, I have changed my mind." Silent updating is better than nothing, but it does not tell them anything.'
      ],
      practice: 'Find one thing today where you let their view change your decision, and say out loud that it did.'
    },
    {
      id: 'l_perpetual', track: 'partner', min: 4,
      title: 'The problem you will never solve',
      dek: 'Most of what couples argue about is permanent. That is not a failure.',
      body: [
        'In Gottman\'s work, roughly two-thirds of what couples argue about is perpetual — rooted in durable differences of personality, values or need. Tidiness. Sociability. Money. How much closeness is the right amount. These do not get solved, and treating them as solvable is what turns them poisonous.',
        'The distinction that matters is between dialogue and gridlock. Couples who do well can talk about their perpetual problems with some humour and affection, and nothing gets resolved. Couples in trouble hit the same subject and it becomes an entrenched position with a wall behind it.',
        'The goal, then, is not resolution. It is being able to have the conversation again without damage — understanding why the thing matters so much to them, rather than negotiating a settlement neither of you believes in.',
        'This is genuinely freeing when it lands. A lot of people are exhausted from trying to fix something that was never a fault.'
      ],
      practice: 'Name your perpetual problem. Have ten minutes of conversation about it with an explicit agreement not to try to solve it.'
    },
    {
      id: 'l_start', track: 'partner', min: 3,
      title: 'The first three minutes',
      dek: 'How a hard conversation opens largely decides how it ends.',
      body: [
        'In Gottman\'s lab, the opening minutes of a conflict discussion predicted its outcome with striking reliability. A harsh start-up — sarcasm, an accusation, "you always" — very rarely recovers, whatever happens later.',
        'A softened start-up has three parts and takes one sentence. What you feel. The specific situation, not the person. What you need, stated positively. "I am worried about Saturday. Can we sort the plan tonight?"',
        'Note what is missing: the history, the case, the evidence that you are right. Those feel necessary and they are the thing that makes the conversation unwinnable.',
        'This is the highest-leverage single change available to most people, because it costs nothing and applies to every difficult conversation you will ever have, including the ones at work.'
      ],
      practice: 'Open one difficult conversation today with feeling, situation, need. One sentence, no preamble.'
    },

    {
      id: 'l_afterkids', track: 'parenting', min: 4,
      title: 'What children do to a couple',
      dek: 'Satisfaction drops for most couples. Knowing that is protective.',
      body: [
        'Across a large body of research, relationship satisfaction declines for the majority of couples in the years after a child arrives. Sleep goes, time alone goes, and the relationship quietly reorganises itself around logistics.',
        'This is worth knowing because of the story people tell themselves when it happens. In the absence of the information, "we are not what we were" gets read as evidence that the relationship was wrong, or that the other person changed. Usually it is evidence that you have two children and no time.',
        'The couples who come through it are not the ones who felt no strain. They are the ones who kept some part of the relationship that was not about the children, and who treated the drop as a stage rather than a verdict.',
        'None of this is an argument for tolerating anything. It is an argument for correctly identifying what you are dealing with before you decide what it means.'
      ],
      practice: 'Name one thing you used to do together that stopped when the children came. Consider whether any version of it is recoverable.'
    },
    {
      id: 'l_load', track: 'parenting', min: 5,
      title: 'The list nobody can see',
      dek: 'The difference between doing the task and carrying it.',
      body: [
        'There are two kinds of domestic work. There is the doing — the washing, the lifts, the dinner. And there is the remembering: knowing the form is due, that the shoes no longer fit, that one of them has fallen out with a friend, that the appointment needs rebooking.',
        'The second kind is invisible, never appears on a rota, and is exhausting in a way that is hard to describe to someone who is not doing it. It is also, in most households, distributed far more unevenly than the visible work.',
        'This is the source of a specific and very common argument, which sounds like "I do loads around here" met with "but I have to ask you". Both are accurate. One person is doing tasks; the other is running the system that generates the tasks. Being asked to delegate is itself work.',
        'The fix is not doing more. It is taking whole categories — owning something end to end, including the remembering, so it leaves the other person\'s head entirely. One category genuinely owned is worth more than a great deal of helping.'
      ],
      practice: 'Write the invisible list — everything that has to be remembered, not done. Then take one item and own it completely.'
    },
    {
      id: 'l_conflict', track: 'parenting', min: 4,
      title: 'What children take from your arguments',
      dek: 'It is not the conflict that harms them. It is conflict they never see resolved.',
      body: [
        'Parents often try to have no conflict in front of children. The research points somewhere more specific: what predicts difficulty for children is not witnessing disagreement, it is witnessing hostile, unresolved disagreement — and never seeing the repair.',
        'Children who see parents disagree and then visibly put it right learn something valuable: conflict is survivable, people who love each other have it, and it gets fixed. That is a template they will use in their own relationships for decades.',
        'Children who see the row and never the repair take away something else. They know something is wrong, they cannot see it resolve, and in the absence of an explanation they usually construct one in which they are somehow implicated.',
        'The practical version: not all of it has to be hidden. But if they saw the argument, let them see some version of the ending.'
      ],
      practice: 'If they see conflict today, let them see the repair too. "We were cross, we have sorted it out, and it was not about you."'
    },
    {
      id: 'l_coparent', track: 'parenting', min: 4,
      title: 'When you are parenting apart',
      dek: 'Three things that matter more than everything else combined.',
      body: [
        'Where parents separate, the research is fairly consistent about what drives outcomes for children. It is much less about the separation itself than about what happens around it.',
        'First: children must not be in the middle. Not as messengers, not as sources of information about the other household, not as confidants about adult grievances. Every one of those puts a child in a position they cannot win.',
        'Second: ongoing hostility between parents is the strongest predictor of difficulty. Not the split — the sustained conflict after it. A low-warmth but civil arrangement is substantially better for a child than a hostile one, whatever either adult feels is deserved.',
        'Third: children need permission to love the other parent. Criticism of a parent lands on a child as criticism of half of themselves, and they will usually protect the absent parent by hiding their feelings from you.',
        'None of this requires you to feel warmly. It requires you to behave a particular way at handovers and in conversation, which is a discipline rather than an emotion.'
      ],
      practice: 'Say one genuinely positive thing about their other parent, in front of them, and mean it.'
    },
    {
      id: 'l_default', track: 'parenting', min: 3,
      title: 'The default parent',
      dek: 'Being the one who can be relied on, not the one who helps.',
      body: [
        'In most households one parent is the default: the one the school rings, the one who knows the schedule, the one whose plans bend first when something goes wrong. It is rarely decided; it accretes.',
        'The word that gives it away is "help". Helping with your own children implies they are someone else\'s responsibility that you are generously assisting with. It is a small word and it describes an entire arrangement.',
        'Becoming a second default is not about volume of effort. It is about being the person who holds things without supervision — who notices the shoes, books the appointment, knows which one is upset and why.',
        'The test is simple. If you were both away for a week, whose phone would the school have? If the honest answer is only one of you, that is the thing to change.'
      ],
      practice: 'Take one thing you currently "help with" and make it yours outright — including the remembering.'
    },
    {
      id: 'l_childtime', track: 'parenting', min: 3,
      title: 'Ten minutes that does more than an hour',
      dek: 'Child-led time, and why the rules are so strict.',
      body: [
        'Ten minutes a day with one child, where they lead and you follow, is one of the best-supported interventions in the whole parenting literature. It is used clinically for behaviour difficulties and it works about as well for ordinary families.',
        'The rules are narrow and they are the reason it works. They choose the activity. You do not teach, correct, question or steer it anywhere useful. You describe what they are doing occasionally so they know you are watching. No phone.',
        'It is harder than it sounds, because most parental attention comes with an agenda attached — a lesson, a correction, a tidy-up. Attention with no agenda is rarer than we think, and children can tell the difference immediately.',
        'The effect is not really about the ten minutes. It is that a child who reliably gets your undivided attention stops having to work for it in less convenient ways.'
      ],
      practice: 'Ten minutes today, one child, their choice, no steering. Notice how strong the urge to teach is.'
    },

    {
      id: 'l_notherapy', track: 'self', min: 3,
      title: 'What this can and cannot do',
      dek: 'Worth reading before you go further.',
      body: [
        'Everything here is educational material drawn from published research on couples and families. It is not therapy, and it is not a substitute for it.',
        'The honest limitation of a solo app is structural: couples work needs both people. What you can do alone is your half — your regulation, your defaults under pressure, your part in the loop, what you carry, what you repair. That is a substantial half and it is not nothing. But it cannot make someone else participate.',
        'There is also a category of problem this is wrong for. Where there is fear, coercion, control, or violence in a relationship, the standard couples advice does not apply and some of it actively makes things worse. That needs a professional and often a specialist service, not a task list.',
        'The same applies to your own state. If you are in crisis, or if what you are carrying is heavier than a daily plan, talk to your GP or someone you trust. Doing that is not a failure of this plan; it is the correct use of it.'
      ],
      practice: 'If anything in that last paragraph applied to you, act on it this week rather than filing it.'
    },
    {
      id: 'l_change', track: 'self', min: 3,
      title: 'Why announced change does not count',
      dek: 'The gap between telling someone you have changed and them noticing.',
      body: [
        'When people decide to change, the first instinct is usually to announce it. It feels like progress and it is a way of asking for credit in advance.',
        'The difficulty is that announcing change puts the other person in an awkward position. They are now being asked to believe a claim about the future and to be encouraging about it, while their actual evidence is the past.',
        'Quiet change works differently. It accumulates without being cashed in, and at some point the other person notices on their own. Change they notice themselves is worth vastly more than change you told them about, because they arrived at it from evidence.',
        'This is also protective for you. Announced change creates a deadline and an audience, and both make it harder to survive the week where you do it badly.'
      ],
      practice: 'Change one specific thing today without telling anyone you are doing it.'
    }
  ];

  MS.lessonById = function (id) {
    for (var i = 0; i < MS.LESSONS.length; i++) {
      if (MS.LESSONS[i].id === id) return MS.LESSONS[i];
    }
    return null;
  };
})(window.MS = window.MS || {});
