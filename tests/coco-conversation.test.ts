import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoQuestions, cocoQuestionCapabilities, cocoQuestionError, COCO_CONVERSATION_GRADES, COCO_GRADE_KEYS } from '../lib/coco/conversation.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
test('every supported answer is asked once without introducing unavailable template slots', () => {
  for (const recipe of recipes) {
    const caps = cocoRecipeFormCapabilities(recipe.recipeId, recipe.formats);
    const questions = cocoQuestions(caps);
    const fields = questions.flatMap(q => q.fields);
    assert.equal(fields.length, new Set(fields).size, recipe.recipeId);
    assert.deepEqual([...fields].sort(), [...caps.fields, ...(caps.fieldFormats.socialPlatforms?.length ? ['socialPlatforms'] : [])].sort(), recipe.recipeId);
    if (caps.fields.includes('date')) assert.equal(questions[0].id, 'date');
    for (const question of questions) {
      const partial = cocoQuestionCapabilities(caps, question.fields);
      assert.ok(partial.fields.every(f => question.fields.includes(f)));
      for (const field of partial.fields) assert.deepEqual(partial.bindings[field], caps.bindings[field]);
    }
  }
});
test('conversation validation keeps authored line structure and capacity while allowing skipped answers', () => {
  const caps = cocoRecipeFormCapabilities('slow-jamz', recipes.find((r: any) => r.recipeId === 'slow-jamz').formats);
  assert.equal(cocoQuestionError({}, caps, caps.fields), null);
  assert.ok(cocoQuestionError({ address: 'x'.repeat(500) }, caps, ['address']));
  assert.equal(cocoQuestionError({ address: 'MIAMI FL' }, caps, ['address']), null);
  assert.equal(cocoQuestionError({ address: 'x'.repeat(500) }, caps, ['date']), null, 'current question validation does not block on another answer');
});
test('color grades use the persisted editor controls and Original is an exact restore operation', () => {
  assert.equal(COCO_CONVERSATION_GRADES[0].values, null);
  for (const grade of COCO_CONVERSATION_GRADES.slice(1)) {
    assert.deepEqual(Object.keys(grade.values!).sort(), [...COCO_GRADE_KEYS].sort());
    assert.ok(Object.values(grade.values!).every(Number.isFinite));
  }
});
