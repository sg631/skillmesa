import React from 'react';
import { Title, Text, TextInput, Textarea, PasswordInput, Button, Stack, Paper, FileInput, Divider, SegmentedControl, Group, useMantineColorScheme, useComputedColorScheme, Center } from '@mantine/core';
import { Sun, Moon } from 'lucide-react';

function SettingsPage() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <Stack align="center" gap="md" py="xl" maw={500} mx="auto">
      <title>settings | skillmesa</title>
      <Title order={1}>(DEFUNCT) Settings</Title>

      <Paper shadow="sm" p="xl" radius="lg" w="100%" withBorder>
        <Stack gap="md">
          <Title order={3}>Appearance</Title>
          <Text size="sm" c="dimmed">Choose your preferred color scheme</Text>
          <SegmentedControl
            value={computedColorScheme}
            onChange={setColorScheme}
            fullWidth
            color="cyan"
            data={[
              { label: (<Center inline gap={6}><Sun size={16} /> Light</Center>), value: 'light' },
              { label: (<Center inline gap={6}><Moon size={16} /> Dark</Center>), value: 'dark' },
            ]}
          />
        </Stack>
      </Paper>

      <Paper shadow="sm" p="xl" radius="lg" w="100%" withBorder>
        <Stack gap="md">
          <Title order={3}>Account Details</Title>
          <Textarea placeholder="loading bio.." minRows={3} />
          <Button size="xs" variant="light">save bio</Button>

          <FileInput placeholder="Upload profile picture" accept="image/*" />
          <Button size="xs" variant="light">upload profile picture</Button>

          <TextInput placeholder="loading username.." />
          <Button size="xs" variant="light">save username</Button>

          <TextInput placeholder="loading display name.." />
          <Button size="xs" variant="light">save display name</Button>

          <TextInput type="date" label="Birthday" />
          <Button size="xs" variant="light">save birthday</Button>
        </Stack>
      </Paper>

      <Paper shadow="sm" p="xl" radius="lg" w="100%" withBorder>
        <Stack gap="md">
          <Title order={3}>Contact Info</Title>
          <TextInput placeholder="loading email.." />
          <Button size="xs" variant="light">save email</Button>

          <TextInput placeholder="loading phone number.." />
          <Button size="xs" variant="light">save phone number</Button>
        </Stack>
      </Paper>

      <Paper shadow="sm" p="xl" radius="lg" w="100%" withBorder>
        <Stack gap="md">
          <Title order={3}>Security</Title>
          <PasswordInput placeholder="current password.." />
          <PasswordInput placeholder="new password.." />
          <PasswordInput placeholder="confirm new password.." />
          <Button size="xs" variant="light">change password</Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default SettingsPage;
