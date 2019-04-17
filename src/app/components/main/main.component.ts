import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Papa } from 'ngx-papaparse';
import { ChangeContext, Options, LabelType } from 'ng5-slider';
import Plotly from 'plotly.js-dist';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  public appTitle = 'Farm efficiency';

  public csvFilePath = '../../../assets/data/REsuretyWebApplicationEngineer.csv';

  public minValue: number;
  public maxValue: number;

  public errorMessage = [];

  public dataToRender: any[];
  public filteredDataToRender: any[];

  public options: Options = {
    step: 1,
    translate: (value: number, label: LabelType): string => {
      switch (label) {
        case LabelType.Low:
          return '<b>' + value + ' %</b>';
        case LabelType.High:
          return '<b>' + value + ' %</b>';
        default:
          return value + ' %';
      }
    }
  };


  constructor(private papa: Papa, private httpClient: HttpClient) {
  }


  ngOnInit() {

    // check file exists:
    this.httpClient.get(this.csvFilePath,
      { responseType: 'text',
        headers: new HttpHeaders({
          Accept: 'text/csv'
        })
     })
    .subscribe(() => {

      this.parseDataAndPlot(this.csvFilePath);

    },
    (err) => {
      if (err.status === 404) {
        this.errorMessage = [
          'No data file found.',
          'Make sure the CSV file is in the \'data\' folder.'
        ];
      }
    });
  }

  parseDataAndPlot(csvFilePath: string) {
    this.papa.parse(csvFilePath, {
      header: true,
      dynamicTyping: true,
      download: true,
      complete: (results) => {
        if (results.data) {

          this.formatDataSet(results);

          const dataSet = this.getDataForAxes(this.dataToRender);
          this.minValue = 0;
          this.maxValue = 100;

          this.drawPlotlyChart(dataSet);
        } else {
          this.errorMessage = [
            'Could not process file.'
          ];
        }
      }
    });
  }


  drawPlotlyChart(dataSet: any) {
    const plotlyData = {
      type: 'scatter',
      x: dataSet.labels,
      y: dataSet.values,
      text: dataSet.texts,
      line: {
        color: 'rgb(13,185,240)'
      }
    };

    const layout = {
      yaxis: {
        title: 'Wind farm efficiency (net capacity factor) % per year'
      }
    };

    Plotly.newPlot(
      'chart-plotly',
      [plotlyData],
      layout,
      {scrollZoom: true,
      responsive: true,
      displayModeBar: false}
    );
  }



  onUserChange(changeContext: ChangeContext) {
    this.minValue = changeContext.value;
    this.maxValue = changeContext.highValue;

    this.filteredDataToRender = this.dataToRender.filter((element: any) =>
    element.y >= this.minValue && element.y <= this.maxValue);

    const dataSet = this.getDataForAxes(this.filteredDataToRender);
    this.drawPlotlyChart(dataSet);
  }


  getDataForAxes(dataToRender: any[]) {
    const Xvalues = dataToRender.map(element => element.x);
    const Yvalues = dataToRender.map(element => element.y);
    return {
      labels: Xvalues,
      values: Yvalues
    };
  }



  formatDataSet(rawBundle: any) {
    // remove the rows of data that contain errors:
    if (rawBundle.errors && rawBundle.errors.length > 0) {
      rawBundle.errors.map( (element: any) => {
        const numRow = element.row;
        rawBundle.data.splice(numRow, 1);
      });
    }

    let rawData = rawBundle.data;

    // discard values with 'NA':
    rawData = rawData.filter((element: any) => element.GenerationMWhPerYear !== 'NA');

    this.dataToRender = [];

    const arrayOfGenerationMWhPerYearValues = rawData.map((element: any) => element.GenerationMWhPerYear / element.CapacityMW);
    const max = arrayOfGenerationMWhPerYearValues.reduce((a: number, b: number) => {
      return Math.max(a, b);
    }); // const max = Math.max(...arrayOfGenerationMWhPerYearValues);

    rawData.forEach( (element: any) => {
      const res = element.GenerationMWhPerYear / element.CapacityMW;
      const val = (res * 100) / max;
      this.dataToRender.push({
        x: element.Name,
        y: val
      });
    });

    // sort in ascending order:
    this.dataToRender.sort((a, b) => {
      if (a.y < b.y) {
        return -1;
      }
      if (a.y > b.y) {
        return 1;
      }
      return 0;
    });

    // initialize filteredDataToRender so data is showing the first time:
    this.filteredDataToRender = this.dataToRender;
  }

}
