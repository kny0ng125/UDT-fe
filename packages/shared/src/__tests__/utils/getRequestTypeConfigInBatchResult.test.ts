import { getRequestTypeConfigInBatchResult } from '../../utils/getRequestTypeConfigInBatchResult';

describe('getRequestTypeConfigInBatchResult', () => {
  it('should return 실패 config for FAILED', () => {
    expect(getRequestTypeConfigInBatchResult('FAILED')).toEqual({
      label: '실패',
      color: 'bg-red-100 text-red-800',
    });
  });

  it('should return 부분성공 config for PARTIAL_COMPLETED', () => {
    expect(getRequestTypeConfigInBatchResult('PARTIAL_COMPLETED')).toEqual({
      label: '부분성공',
      color: 'bg-orange-100 text-orange-800',
    });
  });

  it('should return 성공 config for COMPLETED', () => {
    expect(getRequestTypeConfigInBatchResult('COMPLETED')).toEqual({
      label: '성공',
      color: 'bg-green-100 text-green-800',
    });
  });

  it('should return raw status as label for unknown status', () => {
    const result = getRequestTypeConfigInBatchResult('PENDING');
    expect(result).toEqual({
      label: 'PENDING',
      color: 'bg-gray-100 text-gray-800',
    });
  });
});
