export function goBackOrHome(navigation, fallbackScreen = 'Dashboard') {
  if (navigation?.canGoBack?.()) {
    navigation.goBack();
    return;
  }

  const ownRoutes = navigation?.getState?.()?.routeNames || [];
  if (ownRoutes.includes(fallbackScreen)) {
    navigation.navigate(fallbackScreen);
    return;
  }
  if (ownRoutes.includes('AdminTabs')) {
    navigation.navigate('AdminTabs', { screen: fallbackScreen });
    return;
  }
  if (ownRoutes.includes('WorkerTabs')) {
    navigation.navigate('WorkerTabs', { screen: fallbackScreen });
    return;
  }
  if (ownRoutes.includes('PublicTabs')) {
    navigation.navigate('PublicTabs', { screen: fallbackScreen === 'Home' ? 'Home' : fallbackScreen });
    return;
  }

  const parent = navigation?.getParent?.();
  const parentRoutes = parent?.getState?.()?.routeNames || [];
  if (parentRoutes.includes(fallbackScreen)) {
    parent.navigate(fallbackScreen);
    return;
  }

  if (parentRoutes.includes('AdminTabs')) {
    parent.navigate('AdminTabs', { screen: fallbackScreen });
    return;
  }
  if (parentRoutes.includes('WorkerTabs')) {
    parent.navigate('WorkerTabs', { screen: fallbackScreen });
    return;
  }
  if (parentRoutes.includes('PublicTabs')) {
    parent.navigate('PublicTabs', { screen: 'Home' });
  }
}
