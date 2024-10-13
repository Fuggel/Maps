import React from 'react';

import headingIcon from '../assets/heading2.png';
import { BaseProps } from '../types/BaseProps';
import { Value } from '../utils/MapboxStyles';

import Images from './Images';
import { SymbolLayer } from './SymbolLayer';

const style = {
  iconImage: 'userLocationHeading',
  iconAllowOverlap: true,
  iconPitchAlignment: 'map',
  iconRotationAlignment: 'map',
} as const;

type Props = BaseProps & {
  heading?: number;
  headingIconSize?: Value<number, ['zoom', 'feature']> | undefined;
};

const HeadingIndicator = ({ heading, headingIconSize }: Props) => {
  return (
    <React.Fragment key="mapboxUserLocationHeadingIndicatorWrapper">
      <Images
        images={{ userLocationHeading: headingIcon }}
        key="mapboxUserLocationHeadingImages"
      />
      <SymbolLayer
        key="mapboxUserLocationHeadingIndicator"
        id="mapboxUserLocationHeadingIndicator"
        sourceID="mapboxUserLocation"
        belowLayerID="mapboxUserLocationWhiteCircle"
        style={{
          iconRotate: heading,
          iconSize: headingIconSize,
          ...style,
        }}
      />
    </React.Fragment>
  );
};

export default HeadingIndicator;
