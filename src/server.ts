import { env } from '@config/env';
import { logger } from '@config/logger';

import { app } from './app';
import '@workers/index';

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Atmos API escutando na porta ${port}`);
});
