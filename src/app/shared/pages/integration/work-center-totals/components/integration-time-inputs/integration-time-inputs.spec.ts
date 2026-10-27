import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegrationTimeInputs, SelectionSummary } from './integration-time-inputs';

type Inputs = { units?: number; secondsPerUnit?: number; selection?: unknown; visible?: boolean };

function setInputs(fixture: ComponentFixture<IntegrationTimeInputs>, inputs: Inputs) {
  Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  fixture.detectChanges();
}

function render(inputs: Inputs) {
  const fixture = TestBed.createComponent(IntegrationTimeInputs);
  const summaries: SelectionSummary[] = [];
  fixture.componentInstance.summary.subscribe((summary) => summaries.push(summary));
  setInputs(fixture, inputs);
  return { fixture, summaries };
}

const fields = (fixture: ComponentFixture<IntegrationTimeInputs>) =>
  Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-ui-hour-input input')) as HTMLInputElement[];

const values = (fixture: ComponentFixture<IntegrationTimeInputs>) => fields(fixture).map((input) => input.value);

// Types into the hours (0) or minutes (1) input like the user would.
function type(fixture: ComponentFixture<IntegrationTimeInputs>, index: number, value: string) {
  const input = fields(fixture)[index];
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('IntegrationTimeInputs', () => {
  it('preloads hours and minutes from units x secondsPerUnit', () => {
    const { fixture } = render({ units: 30, secondsPerUnit: 150, visible: true }); // 4500 s = 1 h 15 min

    expect(values(fixture)).toEqual(['01', '15']);
  });

  it('reloads the calculated time when the selection changes, even if the time is the same', () => {
    const { fixture } = render({ units: 10, secondsPerUnit: 150, selection: [1], visible: true });
    type(fixture, 1, '50');
    expect(values(fixture)).toEqual(['00', '50']);

    setInputs(fixture, { selection: [1, 2] });

    expect(values(fixture)).toEqual(['00', '25']);
  });

  it('does not draw the inputs when not visible but still emits the summary', () => {
    const { fixture, summaries } = render({ units: 10, secondsPerUnit: 150, visible: false });

    expect(fields(fixture)).toHaveLength(0);
    expect(summaries.at(-1)).toEqual({ units: 10, hours: 0, minutes: 25 });
  });

  it('emits the summary on manual edits', () => {
    const { fixture, summaries } = render({ units: 10, secondsPerUnit: 150, visible: true });

    type(fixture, 0, '2');

    expect(summaries.at(-1)).toEqual({ units: 10, hours: 2, minutes: 25 });
  });
});
