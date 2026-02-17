export default ({ env }) => {
  const cloudinaryUrl = env('CLOUDINARY_URL', '');
  const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);

  if (!match) {
    // No CLOUDINARY_URL set — use Strapi's default local provider
    return {};
  }

  return {
    upload: {
      config: {
        provider: '@strapi/provider-upload-cloudinary',
        providerOptions: {
          cloud_name: match[3],
          api_key: match[1],
          api_secret: match[2],
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  };
};
