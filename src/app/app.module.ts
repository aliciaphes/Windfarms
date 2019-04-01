import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MainComponent } from './components/main/main.component';
import { HttpClientModule } from '@angular/common/http';
import { PapaParseModule } from 'ngx-papaparse';
import { Ng5SliderModule } from 'ng5-slider';

@NgModule({
  declarations: [
    MainComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    PapaParseModule,
    Ng5SliderModule,
  ],
  providers: [],
  bootstrap: [MainComponent]
})
export class AppModule { }
