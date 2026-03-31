import { getTodayRecommendSentence } from '../../utils/getTodayRecommendSentence';

const EXPECTED_MESSAGES = [
  '일요일엔 일단한번 봐!',
  '월요일엔 무기력한 당신에게 즐거움을!',
  '화요일엔 화난 당신에게!',
  '수요일엔 수사물!',
  '목요일엔 목적없이 아무거나!',
  '금요일엔 연인과 함께!',
  '토요일엔 잠이 부족한 당신에게!',
];

describe('getTodayRecommendSentence', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([0, 1, 2, 3, 4, 5, 6])(
    'should return correct message for day index %i',
    (dayIndex) => {
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(dayIndex);
      expect(getTodayRecommendSentence()).toBe(EXPECTED_MESSAGES[dayIndex]);
    },
  );

  it('should return a string', () => {
    expect(typeof getTodayRecommendSentence()).toBe('string');
  });
});
