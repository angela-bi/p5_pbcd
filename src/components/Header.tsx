import React from 'react'
import Grid from '@mui/material/Grid2';
import { Divider, Typography } from '@mui/material';

export const Header = () => {
  return (
    <div>
        <Grid container margin={'10px'}>
            <Grid size={3}>
                <Typography>Code</Typography>
            </Grid>
            <Grid size={9}>
                <Typography>Preview</Typography>
            </Grid>
        </Grid>
        <Divider></Divider>
    </div>
  )
}
