import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyFlight } from './analogy-flight';
import { Ch1Flight } from './ch1-flight';
import { Ch10Flight } from './ch10-flight';
import { Ch2Flight } from './ch2-flight';
import { Ch3Flight } from './ch3-flight';
import { Ch4Flight } from './ch4-flight';
import { Ch5Flight } from './ch5-flight';
import { Ch6Flight } from './ch6-flight';
import { Ch7Flight } from './ch7-flight';
import { Ch8Flight } from './ch8-flight';
import { Ch9Flight } from './ch9-flight';
import { HeroFlight } from './hero-flight';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-flight'] = AnalogyFlight;
widgetRegistry['ch1-flight'] = Ch1Flight;
widgetRegistry['ch10-flight'] = Ch10Flight;
widgetRegistry['ch2-flight'] = Ch2Flight;
widgetRegistry['ch3-flight'] = Ch3Flight;
widgetRegistry['ch4-flight'] = Ch4Flight;
widgetRegistry['ch5-flight'] = Ch5Flight;
widgetRegistry['ch6-flight'] = Ch6Flight;
widgetRegistry['ch7-flight'] = Ch7Flight;
widgetRegistry['ch8-flight'] = Ch8Flight;
widgetRegistry['ch9-flight'] = Ch9Flight;
widgetRegistry['hero-flight'] = HeroFlight;
