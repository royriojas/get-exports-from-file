import get from 'lodash/get';
import { parsePropertyCriteria } from 'screening-report-parser';

abstract class ReportData {
  public applicantId?: string;

  constructor(applicantId?: string) {
    this.applicantId = applicantId;
  }

  abstract get setters(): Array<string>;
}

export interface IBuildReportParameters {
  propertyCriteria: IParsedCriteriaObject;
  applicantScreening: IApplicantScreening;
}

export const variable = 1;
