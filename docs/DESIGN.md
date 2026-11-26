# Design notes

## Direction

Dark and minimal. The base is near-black (`#0c0d0e`), not pure black. Surfaces are a step lighter, text is off-white, and there is **one accent colour, signal orange (`#ff6b2c`)**, used only for the main action and for "done". There are no gradients and no purple. Type is Geist, with Geist Mono for numbers so weights and timers line up and don't jump around.

## What shaped it

A short look at gym-logging UX writing and case studies:

- [Made Good Designs: Fitness app design tips](https://madegooddesigns.com/fitness-app-design/)
- [Less pain, more gain: a gym app case study](https://medium.com/@mike.pace/less-pain-more-gain-a-new-gym-app-for-higher-efficiency-workouts-257d09132b8b)
- [Wodify: why are we using half this app?](https://uxdesign.cc/wodify-why-are-we-using-half-this-app-d7100e071b4b)
- [Logging sets without breaking flow](https://dev.to/apoorvdarshan/logging-weight-reps-and-rpe-per-set-without-breaking-flow-2f2m)

What we took from them:

| Lesson | In gWEB |
|---|---|
| Logging has to be faster than the rest period, or people stop. | Sets are pre-filled from last time, so the usual case is one tap on ✓. Ticking a set copies its numbers down to the next ones. |
| Show every set of an exercise on one screen. | The whole workout is one scrolling list. |
| Main controls belong in the thumb zone, with 44–48px targets. | ✓ and the steppers are 44–48px. The rest timer and Finish sit at the bottom and top edges. |
| Start the rest timer automatically. | Ticking a set starts it, with −15 / +15 / Skip. It vibrates when time is up and survives the screen locking. |
| Don't bury Start under stats. | Today's workout and Start come first on Home. |
| Users ignore most features, so cut the rest. | Four tabs. There's no jargon: no RIR/RPE, no 1RM, no deloads. Progress says "best set: 80 kg × 5". |
| Confirm every save. | Workouts end on a "Workout saved" summary, edits show "Changes saved", and Settings shows the sync status. |
| Don't use colour alone for state. | Done sets also show a filled ✓, and records say "New best" in words. |
| Typing and tapping both matter. | Every number field takes typing (numeric keypad) as well as − / +. |
