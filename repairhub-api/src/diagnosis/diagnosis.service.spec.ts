import { DiagnosisService } from './diagnosis.service';

describe('DiagnosisService', () => {
  const serviceOrderRepository = {
    findOne: jest.fn(),
  };
  const diagnosisSessionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const chatMessageRepository = {
    create: jest.fn((v) => v),
    save: jest.fn(),
  };

  let service: DiagnosisService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DiagnosisService(
      diagnosisSessionRepository as any,
      serviceOrderRepository as any,
      chatMessageRepository as any,
    );
  });

  it('starts new no_power session when no session exists', async () => {
    serviceOrderRepository.findOne.mockResolvedValue({
      id: 1,
      defectivePart: 'no enciende',
      deviceBrand: { name: 'Dell' },
      model: 'Latitude',
    });
    diagnosisSessionRepository.findOne.mockResolvedValue(null);
    diagnosisSessionRepository.create.mockImplementation((v) => v);
    diagnosisSessionRepository.save.mockImplementation(async (v) => v);
    chatMessageRepository.save.mockResolvedValue([]);

    const result = await service.next({
      serviceOrderId: '1',
      device: 'Laptop',
    });

    expect(result.expectedAnswerType).toBe('yesno');
    expect(result.question.toLowerCase()).toContain('led');
    expect(diagnosisSessionRepository.create).toHaveBeenCalled();
  });

  it('advances session with yes/no answer', async () => {
    serviceOrderRepository.findOne.mockResolvedValue({
      id: 1,
      defectivePart: 'no enciende',
      deviceBrand: { name: 'Dell' },
      model: 'Latitude',
    });
    diagnosisSessionRepository.findOne.mockResolvedValue({
      id: 'abc',
      serviceOrderId: 1,
      state: {
        category: 'no_power',
        currentStep: 'np_1',
        answers: {},
        lastQuestion: 'q1',
        path: ['np_1'],
      },
    });
    diagnosisSessionRepository.save.mockImplementation(async (v) => v);
    chatMessageRepository.save.mockResolvedValue([]);

    const result = await service.next({
      serviceOrderId: '1',
      device: 'Laptop',
      answer: 'yes',
    });

    expect(result.question.toLowerCase()).toContain('voltaje');
    expect(diagnosisSessionRepository.save).toHaveBeenCalled();
  });

  it('classifies overheating defects to overheating category', () => {
    const category = service.pickCategory('se calienta mucho al arrancar');
    expect(category).toBe('overheating');
  });
});
