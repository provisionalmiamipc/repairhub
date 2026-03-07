export type AnswerType = 'yesno' | 'number' | 'text';

export type RuleNode = {
  id: string;
  question: string;
  expectedAnswerType: AnswerType;
  yes?: string;
  no?: string;
  next?: string;
  hint?: string;
  checklist?: string[];
  confidence?: 'medium' | 'low';
};

export type RuleTree = {
  category: string;
  keywords: string[];
  start: string;
  nodes: Record<string, RuleNode>;
};

export const DIAGNOSIS_RULE_TREES: RuleTree[] = [
  {
    category: 'no_power',
    keywords: ['no power', 'dead', 'power issue', 'won’t start', 'does not turn on'],
    start: 'np_1',
    nodes: {
      np_1: {
        id: 'np_1',
        question: 'Does the device show any LED or indicator when power is connected?',
        expectedAnswerType: 'yesno',
        yes: 'np_2',
        no: 'np_3',
        hint: 'Check original charger and power input port.',
        checklist: ['Verify power adapter/charger', 'Inspect DC or USB-C connector'],
        confidence: 'medium',
      },
      np_2: {
        id: 'np_2',
        question: 'Is battery/main rail voltage within expected range?',
        expectedAnswerType: 'yesno',
        yes: 'np_4',
        no: 'np_5',
        checklist: ['Measure main rail with multimeter', 'Check input fuse continuity'],
        confidence: 'medium',
      },
      np_3: {
        id: 'np_3',
        question: 'Is there continuity across the input fuse?',
        expectedAnswerType: 'yesno',
        yes: 'np_5',
        no: 'end_np_fuse',
        checklist: ['Test fuse', 'Inspect short on primary power line'],
        confidence: 'medium',
      },
      np_4: {
        id: 'np_4',
        question: 'Is there startup activity (fan/beep/variable current draw)?',
        expectedAnswerType: 'yesno',
        yes: 'end_np_fw',
        no: 'end_np_mainboard',
        confidence: 'low',
      },
      np_5: {
        id: 'np_5',
        question: 'Do you want to prioritize testing with a known-good battery/power source?',
        expectedAnswerType: 'yesno',
        yes: 'end_np_battery',
        no: 'end_np_mainboard',
        confidence: 'low',
      },
      end_np_fuse: {
        id: 'end_np_fuse',
        question: 'Next step: replace input fuse/stage and validate for shorts.',
        expectedAnswerType: 'text',
        confidence: 'medium',
      },
      end_np_fw: {
        id: 'end_np_fw',
        question: 'Next step: review firmware/BIOS and power-on sequence.',
        expectedAnswerType: 'text',
        confidence: 'low',
      },
      end_np_battery: {
        id: 'end_np_battery',
        question: 'Next step: replace battery or charger and retest.',
        expectedAnswerType: 'text',
        confidence: 'medium',
      },
      end_np_mainboard: {
        id: 'end_np_mainboard',
        question: 'Next step: diagnose PMIC/regulators on the main board.',
        expectedAnswerType: 'text',
        confidence: 'low',
      },
    },
  },
  {
    category: 'overheating',
    keywords: ['overheating', 'hot', 'thermal', 'high temperature'],
    start: 'oh_1',
    nodes: {
      oh_1: {
        id: 'oh_1',
        question: 'Does the fan spin at normal speed under load?',
        expectedAnswerType: 'yesno',
        yes: 'oh_2',
        no: 'end_oh_fan',
        checklist: ['Inspect fan condition', 'Clean dust from thermal path'],
        confidence: 'medium',
      },
      oh_2: {
        id: 'oh_2',
        question: 'Was thermal paste replaced recently?',
        expectedAnswerType: 'yesno',
        yes: 'oh_3',
        no: 'end_oh_paste',
        confidence: 'medium',
      },
      oh_3: {
        id: 'oh_3',
        question: 'Does temperature increase even at idle?',
        expectedAnswerType: 'yesno',
        yes: 'end_oh_sensor',
        no: 'end_oh_workload',
        confidence: 'low',
      },
      end_oh_fan: {
        id: 'end_oh_fan',
        question: 'Next step: repair/replace fan and verify PWM control.',
        expectedAnswerType: 'text',
        confidence: 'medium',
      },
      end_oh_paste: {
        id: 'end_oh_paste',
        question: 'Next step: apply thermal paste and verify heatsink contact.',
        expectedAnswerType: 'text',
        confidence: 'medium',
      },
      end_oh_sensor: {
        id: 'end_oh_sensor',
        question: 'Next step: validate thermal sensor or PMIC/CPU fault.',
        expectedAnswerType: 'text',
        confidence: 'low',
      },
      end_oh_workload: {
        id: 'end_oh_workload',
        question: 'Next step: review high-load processes and power profile.',
        expectedAnswerType: 'text',
        confidence: 'low',
      },
    },
  },
  {
    category: 'no_image',
    keywords: ['no image', 'no display', 'black screen', 'no video'],
    start: 'ni_1',
    nodes: {
      ni_1: {
        id: 'ni_1',
        question: 'Do you get image output on an external monitor?',
        expectedAnswerType: 'yesno',
        yes: 'end_ni_panel',
        no: 'ni_2',
        checklist: ['Test with external HDMI/DP', 'Check display hotkey combination'],
        confidence: 'medium',
      },
      ni_2: {
        id: 'ni_2',
        question: 'Do you hear system boot or notification sounds?',
        expectedAnswerType: 'yesno',
        yes: 'ni_3',
        no: 'end_ni_boot',
        confidence: 'medium',
      },
      ni_3: {
        id: 'ni_3',
        question: 'Does the panel backlight turn on?',
        expectedAnswerType: 'yesno',
        yes: 'end_ni_signal',
        no: 'end_ni_backlight',
        confidence: 'medium',
      },
      end_ni_panel: {
        id: 'end_ni_panel',
        question: 'Next step: inspect internal flex cable/LCD panel.',
        expectedAnswerType: 'text',
        confidence: 'medium',
      },
      end_ni_boot: {
        id: 'end_ni_boot',
        question: 'Next step: diagnose boot/mainboard before video path.',
        expectedAnswerType: 'text',
        confidence: 'low',
      },
      end_ni_signal: {
        id: 'end_ni_signal',
        question: 'Next step: validate eDP/LVDS signal from GPU/chipset.',
        expectedAnswerType: 'text',
        confidence: 'low',
      },
      end_ni_backlight: {
        id: 'end_ni_backlight',
        question: 'Next step: inspect backlight circuit and panel fuse.',
        expectedAnswerType: 'text',
        confidence: 'medium',
      },
    },
  },
];

export const DEFAULT_CATEGORY = 'no_power';
