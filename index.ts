// Define the background task before expo-router loads routes (lazily, via
// require.context). A headless Android wake must find the task already defined.
import './src/background/purgeTask';
import 'expo-router/entry';
