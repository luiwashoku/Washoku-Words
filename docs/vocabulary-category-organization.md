# 単語 — Category organization

The 1,578 vocabulary entries are grouped into 24 categories, with dining, travel, shopping and cooking lessons first. Every existing spelling, reading, meaning, example and speech key is retained. Source sections remain visible within merged categories.

The restaurant category combines Restaurants and eating out, Eating out and buying food, and Restaurants and tableware. Other overlaps are combined across travel/hotels, clothing/fit, home/routines, health/discomfort, learning/review and work/exhibitions. Weather words from the old mixed Nature topic are in Weather; 自然 is in Nature with both of its existing meanings and examples.

| Order | Category | Words | Cards |
| --- | --- | --- | --- |
| 1 | Restaurants, tableware and food shopping | 37 | 5 |
| 2 | Travel, transport and hotels | 81 | 9 |
| 3 | Shopping and payment | 68 | 10 |
| 4 | Cooking, lessons and instructions | 68 | 8 |
| 5 | Clothing, fit and sizes | 38 | 5 |
| 6 | Conversation, messages and calls | 123 | 11 |
| 7 | Requests, help and preferences | 23 | 2 |
| 8 | Meeting up and making plans | 43 | 5 |
| 9 | Signs and announcements | 16 | 2 |
| 10 | Health, discomfort and body parts | 106 | 12 |
| 11 | Weather, temperature and seasons | 101 | 9 |
| 12 | Time and frequency | 49 | 5 |
| 13 | Ingredients, flavour and texture | 33 | 4 |
| 14 | Life, interests and relationships | 85 | 8 |
| 15 | Everyday objects and routines | 82 | 10 |
| 16 | Learning, recording and review | 82 | 7 |
| 17 | Object problems and solutions | 49 | 5 |
| 18 | Actions, posture and movement | 147 | 17 |
| 19 | Feelings and personality | 68 | 6 |
| 20 | Qualities, sensations and descriptions | 139 | 12 |
| 21 | Change and results | 41 | 4 |
| 22 | Nature, scenery and living things | 34 | 5 |
| 23 | Materials | 27 | 3 |
| 24 | Work and exhibition projects | 38 | 4 |

Organization source: `data/vocabulary-topic-organization.json`. Rebuild using `python3 scripts/build-topic-vocabulary.py`, then update the reference list with `python3 scripts/export-topic-vocabulary-list.py`.

New words in existing source topics follow the same category mapping. A new source topic without a mapping is appended so it is not lost; it can be assigned a priority later. The builder checks that every source vocabulary key appears exactly once after reorganization.
