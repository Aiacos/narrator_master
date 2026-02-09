# Adventure Journal Structure Guide

This guide teaches you how to organize your adventure Journal to obtain high-quality AI suggestions and accurate off-track detection.

## Why Journal Structure Matters

The adventure Journal is the **contextual brain** of Narrator Master. The AI analyzes the Journal content to:

- **Generate relevant suggestions** based on the current situation
- **Detect when players go off-track** from the planned plot
- **Propose narrative bridges** to bring players back to the story
- **Provide quick references** to NPCs, locations, and events

> **Key principle**: A well-structured Journal = more useful and accurate AI suggestions.

### Benefits of Good Structure

| Benefit | Description |
|---------|-------------|
| **Accurate suggestions** | The AI better understands context and proposes relevant advice |
| **Precise detection** | More accurately identifies deviations from the plot |
| **Quick references** | Rapidly finds information about NPCs, locations, and events |
| **Token savings** | Organized content = fewer API tokens = reduced costs |

## Recommended Structure

### Page Organization

Divide the Journal into logical, clearly labeled pages:

```
📖 Journal: "The Mystery of the Tower" Adventure
  📄 Adventure Overview
  📄 Act 1: Arrival at the Village
  📄 Act 2: Investigating the Tower
  📄 Act 3: The Final Confrontation
  📄 Major NPCs
  📄 Important Locations
  📄 Objects and Clues
  📄 Secrets and Revelations
```

### Page: Adventure Overview

The first page should provide an overview of the adventure.

**Example content**:

```markdown
# The Mystery of the Tower

## Main Plot
The characters are summoned to the small village of Greydale by Mayor Aldric.
A mysterious tower appeared overnight in the nearby forest. Strange phenomena
afflict the village: children speaking ancient languages, animals behaving
strangely, and dreams shared by all inhabitants.

## Final Objective
Explore the tower, discover that it's an ancient dimensional prison, and decide whether to
free or re-imprison the ancient entity trapped within.

## Central Theme
Ambiguous moral choices: is the entity truly evil or was it unjustly imprisoned?

## Expected Duration
3-4 sessions (12-16 hours of play)

## Recommended Level
Characters level 5-7
```

### Page: Act by Act

Each major act should have a dedicated page with clear objectives and key events.

**Example - Act 1: Arrival at the Village**:

```markdown
# Act 1: Arrival at the Village

## Act Objectives
- Introduce characters to the village and major NPCs
- Establish the unsettling atmosphere
- Provide the first clues about the tower mystery
- Motivate characters to investigate

## Key Events

### Scene 1: The Arrival
Characters arrive at Greydale at sunset. The village seems deserted,
the streets are empty. From inside the houses, voices can be heard whispering in an
incomprehensible language.

**Atmosphere**: Unsettling, mysterious, slightly menacing.

**Available clues**:
- The voices cease when characters approach the doors
- Strange footprints in the mud (human shape but fingers too long)
- A raven watches the characters and follows them

### Scene 2: Meeting Aldric
Mayor Aldric awaits them at the "Weary Traveler" inn.
He is visibly frightened and tired.

**Key dialogue**:
"Three nights ago, during the new moon, a green flash illuminated the forest.
By morning, the tower was there. There's no path leading to it, yet the village
children draw it in their dreams."

**Information he provides**:
- The tower appeared 3 nights ago
- The strange phenomena began the same night
- No one has yet dared approach it
- He will offer 500 gp to investigate

### Scene 3: Village Exploration
Characters can explore and talk with the inhabitants.

**Available NPCs**:
- **Elara** (healer): Has tried cures but they don't work. Speaks of "ancient energies"
- **Tomás** (blacksmith): His son draws strange symbols. Tools magnetize on their own
- **Sister Miriam** (priestess): Prayers seem ineffective. The temple is cold

**Additional clues**:
- Children's drawings show the same tower from different angles
- Animals avoid a specific direction (toward the tower)
- Plants in the tower's direction are slightly withered

## Possible Deviations

### If players want to go to the tower immediately
Don't prevent it, but make it clear that having more information would be wise.
Aldric can express concern and offer to prepare supplies for the next day.

### If players suspect the inhabitants
Let them investigate, but all inhabitants are innocent victims.
They can find symbols drawn by children that correspond to ancient runes.

## Transition to Act 2
The act concludes when characters decide to head toward the tower.
This should happen naturally after gathering sufficient information.
```

### Page: Major NPCs

Dedicate a page to the most important non-player characters.

**Example**:

```markdown
# Major NPCs

## Aldric the Mayor

**Role**: Quest giver, source of information
**Personality**: Worried, protective of the village, pragmatic
**Appearance**: Man in his fifties, gray hair, deep dark circles under eyes
**Motivation**: Protect village inhabitants at all costs

**Key information he possesses**:
- Village and forest history
- Details about strange phenomena
- Contacts with nearby villages
- Local legends about the ancient forest

**Characteristic dialogue**:
- "I've seen many seasons, but nothing like this..."
- "My duty is to these inhabitants. I'll do anything."
- "I'm not superstitious, but this time... I'm afraid."

**If players suspect him**: He'll be hurt but understanding. Offers to be interrogated with magic if necessary.

---

## Elara the Healer

**Role**: Expert in herbs and minor healing magic
**Personality**: Calm, wise, intellectually curious
**Appearance**: Elderly woman, braided white hair, penetrating green eyes
**Motivation**: Understand the nature of phenomena to find a cure

**Useful knowledge**:
- Herbalism and alchemy
- Anatomy and unusual symptoms
- Legends about ancient magic
- Knows properties of forest plants

**Characteristic dialogue**:
- "Nature has a balance. This has broken it."
- "I've seen wounds that heal themselves, but never... this."
- "The ancients knew secrets we've forgotten."

**Role in the adventure**: Can identify magical effects on villagers and provide partial protections.

---

## The Tower Entity (Revealed in Act 3)

**Ancient name**: Vaelthys
**Nature**: Planar entity of neutral alignment
**Appearance**: Fluid humanoid form of violet energy, eyes reflecting galaxies
**Motivation**: To be freed after millennia of imprisonment

**Truth about its imprisonment**:
Vaelthys was imprisoned 800 years ago by a council of mages who considered it
dangerous. In reality, it was just misunderstood: its alien nature caused involuntary
effects on the fabric of reality.

**What it can offer the characters**:
- Ancient planar knowledge
- A gift (minor magical ability)
- Material reward (planar gems)

**If freed**: Thanks the characters and vanishes to its plane of origin.
The phenomena cease immediately.

**If re-imprisoned**: Sadly accepts its fate.
The phenomena cease but it remains alone for more centuries.

**Key dialogue**:
- "Millennia... you cannot comprehend millennia of solitude."
- "I don't ask forgiveness, I ask only understanding."
- "Your choice will define who you are, not who I am."
```

### Page: Important Locations

Describe key locations with details useful for the AI.

**Example**:

```markdown
# Important Locations

## The Village of Greydale

**General description**:
Small agricultural village of about 200 inhabitants, located on the edge of the
Ancient Forest. Buildings mainly of wood and stone, with Peloria's temple
as the largest building.

**Normal atmosphere**: Peaceful, industrious, welcoming
**Current atmosphere**: Unsettling, suspended, pervaded by tension

**Main buildings**:
- "Weary Traveler" Inn (meeting point)
- Mayor's house (two-story building, well-maintained)
- Temple of Peloria (white stone, tended garden)
- Tomás's Forge (always with fire burning)
- Elara's Shop (medicinal plants everywhere)

**Geography**:
- South: cultivated fields
- North: Ancient Forest (where the tower appeared)
- East: road to the city of Merivald (3 days' travel)
- West: hills and pastures

---

## The Dimensional Tower

**External appearance**:
Cylindrical tower 30 meters high, built with a glossy black stone that seems
to absorb light. Luminous violet runes pulse irregularly on the surface.
No door or window visible from below.

**Atmosphere**: Alien, ancient, pulsing with magical energy

**Geography**:
Appears in a clearing in the Ancient Forest, about 2 hours' walk from the village.
Surrounding vegetation is slightly withered in a 20-meter radius.

**How to enter**:
The entrance manifests only at sunset or with a specific ritual
(clues findable in children's drawings).

**Interior - Ground Floor**:
Circular hall with glass floor showing galaxies beneath feet.
Four statues of hooded figures point upward. Central spiral staircase.

**Interior - Upper Floors**:
Each floor contains puzzles related to elements (earth, air, fire, water).
Solutions require cooperation or creative insights, not just strength.

**Interior - Top**:
Octagonal chamber with Vaelthys at the center, surrounded by chains of magical energy.
A control circle on the floor allows strengthening or dissolving the chains.

**Dangers**:
- Magical guardians (energy constructs, not hostile unless threatened)
- Dimensional traps (teleportation to other rooms)
- Temporal distortions (a few seconds can feel like hours)

---

## The Ancient Forest

**Description**:
Ancient forest surrounding Greydale. Centuries-old trees, little sunlight at ground level,
moss everywhere. Normally peaceful, now pervaded by an unnatural energy.

**Current atmosphere**: Tense, silent (no bird song),
the air feels "dense"

**Possible encounters**:
- Animals behaving strangely
- Minor fey confused by magical phenomena
- Lost travelers (might ask for help)

**Challenges**:
- Difficult orientation (normal navigation techniques fail near the tower)
- Minor magical phenomena (will-o'-wisps, voice echoes)
```

### Page: Secrets and Revelations

This page should contain information that players will gradually discover.

**Example**:

```markdown
# Secrets and Revelations

## The Tower's True Purpose

**Secret**: The tower is not a physical structure, but a dimensional prison
that manifests in the material plane when containment energy weakens.

**When to reveal**: When characters read the runes on the tower or consult
a planar magic expert.

**Impact on the story**: Explains why the tower appeared "from nowhere" and
why no one remembers it.

---

## Vaelthys's Innocence

**Secret**: Vaelthys is not evil. Its presence causes side effects
because its planar nature is incompatible with the material plane,
but it has no hostile intentions.

**When to reveal**: During the final confrontation, if characters choose
to talk instead of attack.

**Supporting evidence**:
- No permanent damage to villagers
- Vaelthys offers cooperation, not resistance
- Ancient documents in the tower show it was imprisoned without trial

**Impact on the story**: Creates a moral dilemma - is it right to imprison
someone just because their existence is problematic?

---

## The Forgotten Council

**Secret**: 800 years ago, a council of mages called "The Veil Watchers"
imprisoned Vaelthys. They weren't evil, but frightened and hasty.

**When to reveal**: Finding documents in the tower or talking with Vaelthys.

**Details**:
- The council became extinct centuries ago
- They thought they were protecting the world
- They didn't consider alternatives to imprisonment

**Impact on the story**: Shows that even good intentions can cause
suffering. Adds moral depth.

---

## The Characters' Choice Has Consequences

**Secret**: There is no "correct" solution. Every choice has pros and cons.

**If they free Vaelthys**:
- ✅ She is free and grateful
- ✅ Phenomena cease immediately
- ✅ Characters receive a reward
- ❌ Possible (but not certain) future return of similar problems

**If they re-imprison Vaelthys**:
- ✅ Phenomena cease
- ✅ The village is "protected" long-term
- ❌ An innocent entity suffers
- ❌ Characters must live with this choice

**When to reveal**: After the final choice, in subsequent sessions,
through consistent narrative consequences.
```

## Tips for AI-Friendly Content

### Clarity and Specificity

**✅ GOOD**:
```
Mayor Aldric is worried about the village children.
He will offer 500 gp to characters if they investigate the mysterious tower.
```

**❌ TO AVOID**:
```
Aldric wants them to do something about the thing that appeared.
```

### Use Descriptive Titles

Titles help the AI understand context:

**✅ GOOD**:
```markdown
## Act 2: Tower Exploration
## NPC: Vaelthys the Imprisoned Entity
## Location: Ancient Forest
```

**❌ TO AVOID**:
```markdown
## Part 2
## Character 3
## Important place
```

### Hierarchical Structure

Use appropriate heading levels:

```markdown
# Main Title (H1) - Once per page
## Main Sections (H2) - Major topics
### Subsections (H3) - Specific details
#### Minor Details (H4) - Deep dives
```

### Include Motivations and Objectives

The AI better understands dynamics if you specify the "why":

**✅ GOOD**:
```
Aldric wants to protect the village at all costs because he lost
his family in a goblin attack years ago. He won't allow
it to happen again.
```

**❌ TO AVOID**:
```
Aldric wants help.
```

### Specify Consequences

Indicate what happens with different choices:

**✅ GOOD**:
```
If characters attack Vaelthys immediately:
- She defends herself but doesn't counterattack lethally
- Phenomena in the village worsen
- They lose the opportunity to understand the truth

If characters talk with Vaelthys:
- She explains her story
- Offers cooperation
- Opens the possibility of a peaceful solution
```

### Use Lists and Tables

They make information easier for the AI to scan:

**✅ GOOD**:
```markdown
**Available clues in the room**:
- Rune book open on the table
- Map with tower circled in red
- Half-written letter
```

**✅ EXCELLENT** (with table):
```markdown
| Clue | Where | What It Reveals |
|------|-------|-----------------|
| Rune book | Table | Vaelthys's identity |
| Map | Wall | Tower location |
| Letter | Drawer | Council's intentions |
```

## What to Include and What to Avoid

### ✅ TO INCLUDE

| Element | Why |
|---------|-----|
| **Clear objectives** | The AI knows what to suggest to advance them |
| **NPC motivations** | More realistic and consistent suggestions |
| **Descriptive atmosphere** | The AI can generate appropriate narrative text |
| **Choice consequences** | Better detection of deviations |
| **Example dialogue** | The AI understands tone and style |
| **Alternatives and flexibility** | The AI better handles improvisation |
| **Gradual clues** | Progressive suggestions instead of abrupt revelations |

### ❌ TO AVOID

| Element | Why Problematic |
|---------|-----------------|
| **Game statistics** | The AI doesn't need AC, HP, damage (unless narratively relevant) |
| **Overly long texts** | Consume tokens and slow analysis |
| **External references** | "See page 45 of the manual" - the AI can't access it |
| **Obscure abbreviations** | Write out or explain acronyms |
| **Complex formatting** | Nested tables, colors, fonts - use simple markdown |
| **Non-narrative content** | Generic treasure lists, random tables - better contextual information |

## Do's and Don'ts

### ✅ DO - Do This

#### Write Clear Objectives for Each Act
```markdown
## Act 1 Objectives
1. Characters must meet Aldric and accept the quest
2. They must gather at least 3 clues about the tower mystery
3. They must decide to investigate the tower
```

#### Provide Dialogue Examples
```markdown
**Aldric when characters arrive**:
"Thank the gods you're here! I sent messengers to Merivald
but... I fear there's no time."
```

#### Explain Connections Between Events
```markdown
Children's drawings show the tower because Vaelthys is trying
to communicate through dreams. It's not an attack, it's a call for help.
```

#### Offer Alternatives
```markdown
**If players don't want to go to the tower**:
- Aldric can increase the reward
- An NPC in danger can arrive from the forest
- Phenomena can worsen until they become dangerous
```

#### Describe Atmosphere and Sensations
```markdown
**Tower atmosphere**: The air seems to vibrate with magical energy.
A sound like a slow breath permeates everything. The light from torches
has an unnatural violet tinge.
```

### ❌ DON'T - Don't Do This

#### Don't Use Only Statistics
```markdown
❌ BAD:
Goblin - AC 15, HP 7, Attack +4, Damage 1d6+2

✅ GOOD:
Group of frightened goblins who took refuge in the tower.
Attack only if threatened. Their leader, Grix, speaks Common
and can become an ally if characters show mercy.
```

#### Don't Be Vague
```markdown
❌ BAD:
"Something strange happens in the tower."

✅ GOOD:
"The tower walls pulse with violet light in a breathing rhythm.
When characters approach, they hear a mental whisper:
'Finally... someone hears me...'"
```

#### Don't Forget Motivations
```markdown
❌ BAD:
"The NPC wants characters to enter the tower."

✅ GOOD:
"Elara wants characters to enter the tower because she believes
the source of the villagers' illness is inside. She's willing
to offer her best potions to help them."
```

#### Don't Write Only for Yourself
```markdown
❌ BAD:
"See previous session notes for NPC details."

✅ GOOD:
"Elara is an elderly healer who helped the characters
in the previous session by healing their wounds after the
encounter with infected wolves."
```

#### Don't Include Useless Meta-Information
```markdown
❌ BAD:
"This NPC is important to the plot so MUST NOT DIE."

✅ GOOD:
"Aldric is essential to the quest. If he should die before
revealing key information, his daughter Mira can provide the
same information by reading her father's diary."
```

## Optimal Length

### Size Guidelines

| Page Type | Recommended Length | Reason |
|-----------|-------------------|--------|
| Overview | 300-500 words | Sufficient context without overload |
| Act/Chapter | 500-800 words | Details for an entire session |
| Major NPC | 200-300 words | Clear personality and role |
| Minor NPC | 100-150 words | Only essential information |
| Location | 200-400 words | Atmosphere and relevant details |
| Secret | 100-200 words | Concise but complete |

### Token/Detail Balance

**Remember**: More content = more tokens = higher costs

**Recommended strategy**:
- **Detailed**: Current acts and active NPCs
- **Concise**: Future acts and NPCs not yet encountered
- **Essential**: Background and general history

## Complete Example: Journal Structure

Here's a complete structure example for a short adventure:

```
📖 Journal: "The Mystery of the Tower"

📄 1. Adventure Overview (400 words)
   - Main plot
   - Final objective
   - Central theme
   - Expected duration

📄 2. Act 1: Arrival at the Village (700 words)
   - Act objectives
   - Scene 1: The arrival
   - Scene 2: Meeting Aldric
   - Scene 3: Village exploration
   - Possible deviations
   - Transition to Act 2

📄 3. Act 2: Investigating the Tower (700 words)
   - Act objectives
   - Journey through the forest
   - First entry to the tower
   - Floor exploration
   - Puzzles and challenges
   - Transition to Act 3

📄 4. Act 3: The Final Confrontation (600 words)
   - Act objectives
   - Meeting Vaelthys
   - Revelation of the truth
   - Characters' moral choice
   - Consequences of choices
   - Resolution

📄 5. Major NPCs (600 words)
   - Aldric (mayor)
   - Elara (healer)
   - Vaelthys (entity)
   - Other relevant NPCs

📄 6. Important Locations (500 words)
   - Village of Greydale
   - Dimensional Tower
   - Ancient Forest

📄 7. Secrets and Revelations (400 words)
   - Tower's true purpose
   - Vaelthys's innocence
   - The Forgotten Council
   - Consequences of choices

TOTAL: ~3900 words (approximately 5200 tokens)
```

## Updating During the Campaign

### When to Update

| Moment | What to Update | Why |
|--------|----------------|-----|
| **After each session** | Notes on player choices | The AI considers decisions made |
| **When plans change** | Modified future events | Suggestions consistent with new plans |
| **New major NPCs** | Add to NPC page | Accurate references |
| **Plot deviation** | Create new pages for alternative arcs | Support improvisation |

### How to Update

**✅ Recommended method**:
```markdown
## [POST-SESSION 3 UPDATE]

Characters chose to free Vaelthys immediately,
without completing the tower puzzles. Vaelthys is grateful but the
sudden release caused a magical explosion that damaged
part of the village.

**New direction**:
- Characters must help repair the damage
- Aldric is disappointed but understanding
- Vaelthys offers assistance before leaving
```

**Adding temporary notes**:
```markdown
> **[CURRENT SESSION NOTE]**: Players strongly suspect
> Elara. Prepare clues that exonerate or confirm suspicions.
```

## Integration with Narrator Master

### How the Module Uses the Journal

1. **At startup**: Indexes all text pages of the selected Journal
2. **During recording**: Compares transcription with Journal content
3. **Generating suggestions**: Uses Journal context + recent transcription
4. **Off-track detection**: Identifies when conversation strays from Journal content

### Optimization for the Module

**Cache and Performance**:
- The module caches Journal content after the first read
- Click "Reload Journal" if you made changes during the session
- Smaller Journals = faster AI responses

**Multiple Journal Selection**:
Currently the module supports ONE journal at a time. If you have content in separate journals:
- **Option 1**: Copy everything into a single Journal
- **Option 2**: Use the Journal for the current act, switch when moving to the next

## Related References

To get the most out of the Journal with Narrator Master, also consult:

- **[Usage Guide](./usage.md)** - How to use the DM panel and transcription features
  - "Journal Integration" section for details on selection and reload
  - "AI Suggestions" section to understand how they are generated

- **[Configuration Guide](./configuration.md)** - How to configure the module
  - "Adventure Journal" section to set the default Journal
  - "Off-Track Detection Sensitivity" section to calibrate detection

- **[Troubleshooting](./troubleshooting.md)** - If suggestions are not accurate
  - "Non-relevant suggestions" section for diagnosis and solutions
  - "Cost optimization" section to balance detail and tokens

## Conclusion

A well-structured Journal is the key to getting the most out of Narrator Master. Remember:

1. **Clarity above all** - Write so the AI understands the context
2. **Hierarchical structure** - Use headings and logical organization
3. **Include motivations** - Explain the "why" of actions
4. **Be specific** - Avoid vagueness and external references
5. **Keep it updated** - Reflect campaign changes

Following these guidelines, Narrator Master's AI will be able to provide you with accurate suggestions,
detect plot deviations, and effectively support you during your game sessions.

**Good luck, Game Master!** 🎲
