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

  public minValue: number;
  public maxValue: number;

  public errorMessage = [];

  public dataToRender: any[];

  public options: Options = {
    step: 0.1,
    translate: (value: number, label: LabelType): string => {
      switch (label) {
        case LabelType.Low:
          return '<b>' + value + ' MW</b>';
        case LabelType.High:
          return '<b>' + value + ' MW</b>';
        default:
          return value + ' MW';
      }
    }
  };


  constructor(private papa: Papa, private httpClient: HttpClient) {
  }


  ngOnInit() {

    const csvFilePath = '../../../assets/data/REsuretyWebApplicationEngineer.csv';

    this.httpClient.get(csvFilePath,
      { responseType: 'text',
        headers: new HttpHeaders({
          Accept: 'text/csv'
        })
     })
    .subscribe(() => {
      this.papa.parse(csvFilePath, {
        header: true,
        dynamicTyping: true,
        download: true,
        complete: (results) => {
          if (results.data) {

            this.formatDataSet(results);

            const dataSet = this.getDataForAxes(this.dataToRender);
            this.minValue = dataSet.labels[0];
            this.maxValue = dataSet.labels[dataSet.labels.length - 1];

            this.drawPlotlyChart(dataSet);
          } else {
            this.errorMessage = [
              'Could not process file.'
            ];
          }
        }
      });
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
      xaxis: {
        title: 'maximum possible \'nameplate capacity\' power generation (MW)'
      },
      yaxis: {
        title: 'Average annual energy generation (MW-hours)'
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

    const filteredDataToRender = this.dataToRender.filter((element: any) =>
    element.x >= this.minValue && element.x <= this.maxValue);

    const dataSet = this.getDataForAxes(filteredDataToRender);
    this.drawPlotlyChart(dataSet);
  }


  getDataForAxes(dataToRender: any[]) {
    const Xvalues = dataToRender.map((element: any) => {
      const formattedNumber = element.x;
      return parseFloat(formattedNumber.toFixed(2));
    });

    const Yvalues = dataToRender.map(element => element.y);

    const labels = dataToRender.map(element => element.name);

    return {
      labels: Xvalues,
      values: Yvalues,
      texts: labels
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
    // let found: number;
    rawData.forEach( (element: any) => { // todo: switch to map() ?
        this.dataToRender.push({
          x: element.CapacityMW,
          y: element.GenerationMWhPerYear,
          name: element.Name
        });
    });

    // sort in ascending order:
    this.dataToRender.sort((a, b) => {
      if (a.x < b.x) {
        return -1;
      }
      if (a.x > b.x) {
        return 1;
      }
      return 0;
    });
  }
}
