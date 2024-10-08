import React from 'react';

const ProviderList = ({ providers }) => {
  return (
    <div>
      <h2>Available Storage Providers</h2>
      <ul>
        {providers.map((provider, index) => (
          <li key={index}>
            Address: {provider.address}<br />
            Available Space: {provider.availableSpace} GB<br />
            Price per GB: {provider.pricePerGB} ETH
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProviderList;