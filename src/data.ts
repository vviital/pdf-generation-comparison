import {faker} from '@faker-js/faker';
import * as _ from 'lodash';
import {Sizes} from './types';

export type InstanceDTO = {
  title: string;
  content: string[];
  images: string[];
};

const mappingMultiplier = {
  small: 1,
  medium: 10,
  large: 50,
};

const baseUrl = process.env.IMAGE_SERVICE_BASE_URL || 'http://localhost:8080';
const imagesUrl = () => `${baseUrl}/${_.random(0, 88, false)}.jpg`;

export function createInstance(size: Sizes = 'small'): InstanceDTO {
  return {
    title: faker.music.genre(),
    content: _.times(10 * mappingMultiplier[size], () => faker.lorem.paragraph(10)),
    images: _.times(mappingMultiplier[size], imagesUrl),
  };
}
