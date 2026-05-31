import type { ChapterDef } from "./types";
import Opening from "../chapters/01-opening/Opening";
import { narrations as openingNarrations } from "../chapters/01-opening/narrations";
import Report from "../chapters/02-report/Report";
import { narrations as reportNarrations } from "../chapters/02-report/narrations";
import Conflict from "../chapters/03-conflict/Conflict";
import { narrations as conflictNarrations } from "../chapters/03-conflict/narrations";
import Identity from "../chapters/04-identity/Identity";
import { narrations as identityNarrations } from "../chapters/04-identity/narrations";
import Promise from "../chapters/05-promise/Promise";
import { narrations as promiseNarrations } from "../chapters/05-promise/narrations";
import S2Myth from "../chapters/06-s2-myth/S2Myth";
import { narrations as s2MythNarr } from "../chapters/06-s2-myth/narrations";
import S2GearOverview from "../chapters/07-s2-gear-overview/S2GearOverview";
import { narrations as s2GONarr } from "../chapters/07-s2-gear-overview/narrations";
import S2GearDemand from "../chapters/08-s2-gear-demand/S2GearDemand";
import { narrations as s2GDNarr } from "../chapters/08-s2-gear-demand/narrations";
import S2PrepModel from "../chapters/09-s2-prep-model/S2PrepModel";
import { narrations as s2PMNarr } from "../chapters/09-s2-prep-model/narrations";
import S2Integration from "../chapters/10-s2-integration/S2Integration";
import { narrations as s2IGNarr } from "../chapters/10-s2-integration/narrations";
import S2BankCase from "../chapters/11-s2-bank-case/S2BankCase";
import { narrations as s2BCNarr } from "../chapters/11-s2-bank-case/narrations";
import S2Valve from "../chapters/12-s2-valve/S2Valve";
import { narrations as s2VLNarr } from "../chapters/12-s2-valve/narrations";
import S3Blood from "../chapters/13-s3-blood/S3Blood";
import { narrations as s3BldNarr } from "../chapters/13-s3-blood/narrations";
import S3Pyramid from "../chapters/14-s3-pyramid/S3Pyramid";
import { narrations as s3PyrNarr } from "../chapters/14-s3-pyramid/narrations";
import S3Unstructured from "../chapters/15-s3-unstructured/S3Unstructured";
import { narrations as s3UnsNarr } from "../chapters/15-s3-unstructured/narrations";
import S3Breakpoint from "../chapters/16-s3-breakpoint/S3Breakpoint";
import { narrations as s3BrkNarr } from "../chapters/16-s3-breakpoint/narrations";
import S3Crack from "../chapters/17-s3-crack/S3Crack";
import { narrations as s3CrkNarr } from "../chapters/17-s3-crack/narrations";
import S3Consequence from "../chapters/18-s3-consequence/S3Consequence";
import { narrations as s3CsqNarr } from "../chapters/18-s3-consequence/narrations";
import S3Value from "../chapters/19-s3-value/S3Value";
import { narrations as s3ValNarr } from "../chapters/19-s3-value/narrations";
import S4Intro from "../chapters/20-s4-intro/S4Intro";
import { narrations as s4IntNarr } from "../chapters/20-s4-intro/narrations";
import S4Flow from "../chapters/21-s4-flow/S4Flow";
import { narrations as s4FlwNarr } from "../chapters/21-s4-flow/narrations";
import S4Pause from "../chapters/22-s4-pause/S4Pause";
import { narrations as s4PauNarr } from "../chapters/22-s4-pause/narrations";
import S4Fix1 from "../chapters/23-s4-fix1/S4Fix1";
import { narrations as s4F1Narr } from "../chapters/23-s4-fix1/narrations";
import S4Fix2 from "../chapters/24-s4-fix2/S4Fix2";
import { narrations as s4F2Narr } from "../chapters/24-s4-fix2/narrations";
import S4Conclusion from "../chapters/25-s4-conclusion/S4Conclusion";
import { narrations as s4ConNarr } from "../chapters/25-s4-conclusion/narrations";
import S5Recap from "../chapters/26-s5-recap/S5Recap";
import { narrations as s5RecNarr } from "../chapters/26-s5-recap/narrations";
import S5Motto from "../chapters/27-s5-motto/S5Motto";
import { narrations as s5MotNarr } from "../chapters/27-s5-motto/narrations";
import S5Assignment from "../chapters/28-s5-assignment/S5Assignment";
import { narrations as s5AsgNarr } from "../chapters/28-s5-assignment/narrations";
import S5Quiz from "../chapters/29-s5-quiz/S5Quiz";
import { narrations as s5QizNarr } from "../chapters/29-s5-quiz/narrations";
import S5Next from "../chapters/30-s5-next/S5Next";
import { narrations as s5NxtNarr } from "../chapters/30-s5-next/narrations";
import ConflictScene from "../chapters/31-t2-conflict-scene/ConflictScene";
import { narrations as conflictSceneNarr } from "../chapters/31-t2-conflict-scene/narrations";
import SurgeonRole from "../chapters/32-t2-surgeon-role/SurgeonRole";
import { narrations as surgeonRoleNarr } from "../chapters/32-t2-surgeon-role/narrations";
import MethodPromise from "../chapters/33-t2-method-promise/MethodPromise";
import { narrations as methodPromiseNarr } from "../chapters/33-t2-method-promise/narrations";
import PipelineOverview from "../chapters/34-t2-pipeline-overview/PipelineOverview";
import { narrations as pipelineOverviewNarr } from "../chapters/34-t2-pipeline-overview/narrations";
import DeidentifyRedline from "../chapters/35-t2-deidentify-redline/DeidentifyRedline";
import { narrations as deidentifyRedlineNarr } from "../chapters/35-t2-deidentify-redline/narrations";
import DeidentifyTech from "../chapters/36-t2-deidentify-tech/DeidentifyTech";
import { narrations as deidentifyTechNarr } from "../chapters/36-t2-deidentify-tech/narrations";
import CleanTransform from "../chapters/37-t2-clean-transform/CleanTransform";
import { narrations as cleanTransformNarr } from "../chapters/37-t2-clean-transform/narrations";
import Augment from "../chapters/38-t2-augment/Augment";
import { narrations as augmentNarr } from "../chapters/38-t2-augment/narrations";
import PipelineWrap from "../chapters/39-t2-pipeline-wrap/PipelineWrap";
import { narrations as pipelineWrapNarr } from "../chapters/39-t2-pipeline-wrap/narrations";
import CarVoiceIntro from "../chapters/40-t2-car-voice-intro/CarVoiceIntro";
import { narrations as carVoiceIntroNarr } from "../chapters/40-t2-car-voice-intro/narrations";
import DirtyLog from "../chapters/41-t2-dirty-log/DirtyLog";
import { narrations as dirtyLogNarr } from "../chapters/41-t2-dirty-log/narrations";
import BladeNoise from "../chapters/42-t2-blade-noise/BladeNoise";
import { narrations as bladeNoiseNarr } from "../chapters/42-t2-blade-noise/narrations";
import BladeDeidentify from "../chapters/43-t2-blade-deidentify/BladeDeidentify";
import { narrations as bladeDeidentifyNarr } from "../chapters/43-t2-blade-deidentify/narrations";
import BladeSplit from "../chapters/44-t2-blade-split/BladeSplit";
import { narrations as bladeSplitNarr } from "../chapters/44-t2-blade-split/narrations";
import CleanResult from "../chapters/45-t2-clean-result/CleanResult";
import { narrations as cleanResultNarr } from "../chapters/45-t2-clean-result/narrations";
import IronyExample from "../chapters/46-t2-irony-example/IronyExample";
import { narrations as ironyExampleNarr } from "../chapters/46-t2-irony-example/narrations";
import LabelChaos from "../chapters/47-t2-label-chaos/LabelChaos";
import { narrations as labelChaosNarr } from "../chapters/47-t2-label-chaos/narrations";
import Guideline from "../chapters/48-t2-guideline/Guideline";
import { narrations as guidelineNarr } from "../chapters/48-t2-guideline/narrations";
import GoldenSamples from "../chapters/49-t2-golden-samples/GoldenSamples";
import { narrations as goldenSamplesNarr } from "../chapters/49-t2-golden-samples/narrations";
import CoreValue from "../chapters/50-t2-core-value/CoreValue";
import { narrations as coreValueNarr } from "../chapters/50-t2-core-value/narrations";
import Recap from "../chapters/51-t2-recap/Recap";
import { narrations as recapNarr } from "../chapters/51-t2-recap/narrations";
import Quiz from "../chapters/52-t2-quiz/Quiz";
import { narrations as quizNarr } from "../chapters/52-t2-quiz/narrations";
import SopAssignment from "../chapters/53-t2-sop-assignment/SopAssignment";
import { narrations as sopAssignmentNarr } from "../chapters/53-t2-sop-assignment/narrations";
import Metric from "../chapters/54-t2-metric/Metric";
import { narrations as metricNarr } from "../chapters/54-t2-metric/narrations";
import Next from "../chapters/55-t2-next/Next";
import { narrations as nextNarr } from "../chapters/55-t2-next/narrations";
import Tsunami from "../chapters/56-t3-tsunami/Tsunami";
import { narrations as tsunamiNarr } from "../chapters/56-t3-tsunami/narrations";
import PbVsImage from "../chapters/57-t3-pb-vs-image/PbVsImage";
import { narrations as pbVsImageNarr } from "../chapters/57-t3-pb-vs-image/narrations";
import RookieMistake from "../chapters/58-t3-rookie-mistake/RookieMistake";
import { narrations as rookieMistakeNarr } from "../chapters/58-t3-rookie-mistake/narrations";
import CoursePromiseT3 from "../chapters/59-t3-course-promise/CoursePromise";
import { narrations as coursePromiseT3Narr } from "../chapters/59-t3-course-promise/narrations";
import ReduceDim from "../chapters/60-t3-reduce-dim/ReduceDim";
import { narrations as reduceDimNarr } from "../chapters/60-t3-reduce-dim/narrations";
import SwordUniform from "../chapters/61-t3-sword-uniform/SwordUniform";
import { narrations as swordUniformNarr } from "../chapters/61-t3-sword-uniform/narrations";
import SwordKeyframe from "../chapters/62-t3-sword-keyframe/SwordKeyframe";
import { narrations as swordKeyframeNarr } from "../chapters/62-t3-sword-keyframe/narrations";
import SwordEvent from "../chapters/63-t3-sword-event/SwordEvent";
import { narrations as swordEventNarr } from "../chapters/63-t3-sword-event/narrations";
import Garbage from "../chapters/64-t3-garbage/Garbage";
import { narrations as garbageNarr } from "../chapters/64-t3-garbage/narrations";
import Scenario from "../chapters/65-t3-scenario/Scenario";
import { narrations as scenarioNarr } from "../chapters/65-t3-scenario/narrations";
import PlanA from "../chapters/66-t3-plan-a/PlanA";
import { narrations as planANarr } from "../chapters/66-t3-plan-a/narrations";
import PlanB from "../chapters/67-t3-plan-b/PlanB";
import { narrations as planBNarr } from "../chapters/67-t3-plan-b/narrations";
import CostCrush from "../chapters/68-t3-cost-crush/CostCrush";
import { narrations as costCrushNarr } from "../chapters/68-t3-cost-crush/narrations";
import BusinessValue from "../chapters/69-t3-business-value/BusinessValue";
import { narrations as businessValueNarr } from "../chapters/69-t3-business-value/narrations";
import VideoDeident from "../chapters/70-t3-video-deident/VideoDeident";
import { narrations as videoDeidentNarr } from "../chapters/70-t3-video-deident/narrations";
import IdSwitch from "../chapters/71-t3-id-switch/IdSwitch";
import { narrations as idSwitchNarr } from "../chapters/71-t3-id-switch/narrations";
import IdSolution from "../chapters/72-t3-id-solution/IdSolution";
import { narrations as idSolutionNarr } from "../chapters/72-t3-id-solution/narrations";
import CoreBarrier from "../chapters/73-t3-core-barrier/CoreBarrier";
import { narrations as coreBarrierNarr } from "../chapters/73-t3-core-barrier/narrations";
import RecapT3 from "../chapters/74-t3-recap/Recap";
import { narrations as recapT3Narr } from "../chapters/74-t3-recap/narrations";
import QuizT3 from "../chapters/75-t3-quiz/Quiz";
import { narrations as quizT3Narr } from "../chapters/75-t3-quiz/narrations";
import SopT3 from "../chapters/76-t3-sop/Sop";
import { narrations as sopT3Narr } from "../chapters/76-t3-sop/narrations";
import NextT3 from "../chapters/77-t3-next/Next";
import { narrations as nextT3Narr } from "../chapters/77-t3-next/narrations";
import CallcenterDisaster from "../chapters/78-t4-callcenter-disaster/CallcenterDisaster";
import { narrations as callcenterDisasterNarr } from "../chapters/78-t4-callcenter-disaster/narrations";
import AsrFail from "../chapters/79-t4-asr-fail/AsrFail";
import { narrations as asrFailNarr } from "../chapters/79-t4-asr-fail/narrations";
import ThreeDMaze from "../chapters/80-t4-3d-maze/ThreeDMaze";
import { narrations as threeDMazeNarr } from "../chapters/80-t4-3d-maze/narrations";
import CoursePromiseT4 from "../chapters/81-t4-course-promise/CoursePromise";
import { narrations as coursePromiseT4Narr } from "../chapters/81-t4-course-promise/narrations";
import WaveformSpectrogram from "../chapters/82-t4-waveform-spectrogram/WaveformSpectrogram";
import { narrations as waveformSpectrogramNarr } from "../chapters/82-t4-waveform-spectrogram/narrations";
import SampleRate from "../chapters/83-t4-sample-rate/SampleRate";
import { narrations as sampleRateNarr } from "../chapters/83-t4-sample-rate/narrations";
import Channel from "../chapters/84-t4-channel/Channel";
import { narrations as channelNarr } from "../chapters/84-t4-channel/narrations";
import BitDepth from "../chapters/85-t4-bit-depth/BitDepth";
import { narrations as bitDepthNarr } from "../chapters/85-t4-bit-depth/narrations";
import VadIntro from "../chapters/86-t4-vad-intro/VadIntro";
import { narrations as vadIntroNarr } from "../chapters/86-t4-vad-intro/narrations";
import Slicing from "../chapters/87-t4-slicing/Slicing";
import { narrations as slicingNarr } from "../chapters/87-t4-slicing/narrations";
import Crosstalk from "../chapters/88-t4-crosstalk/Crosstalk";
import { narrations as crosstalkNarr } from "../chapters/88-t4-crosstalk/narrations";
import Judgment from "../chapters/89-t4-judgment/Judgment";
import { narrations as judgmentNarr } from "../chapters/89-t4-judgment/narrations";
import GuidelineIntro from "../chapters/90-t4-guideline-intro/GuidelineIntro";
import { narrations as guidelineIntroNarr } from "../chapters/90-t4-guideline-intro/narrations";
import HesitationStutter from "../chapters/91-t4-hesitation-stutter/HesitationStutter";
import { narrations as hesitationStutterNarr } from "../chapters/91-t4-hesitation-stutter/narrations";
import Dialect from "../chapters/92-t4-dialect/Dialect";
import { narrations as dialectNarr } from "../chapters/92-t4-dialect/narrations";
import VoicePrivacy from "../chapters/93-t4-voiceprivacy/VoicePrivacy";
import { narrations as voicePrivacyNarr } from "../chapters/93-t4-voiceprivacy/narrations";
import RecapT4 from "../chapters/94-t4-recap/Recap";
import { narrations as recapT4Narr } from "../chapters/94-t4-recap/narrations";
import QuizT4 from "../chapters/95-t4-quiz/Quiz";
import { narrations as quizT4Narr } from "../chapters/95-t4-quiz/narrations";
import SopT4 from "../chapters/96-t4-sop/Sop";
import { narrations as sopT4Narr } from "../chapters/96-t4-sop/narrations";
import NextT4 from "../chapters/97-t4-next/Next";
import { narrations as nextT4Narr } from "../chapters/97-t4-next/narrations";
import BlackTruck from "../chapters/98-t5-black-truck/BlackTruck";
import { narrations as blackTruckNarr } from "../chapters/98-t5-black-truck/narrations";
import NotPhoto from "../chapters/99-t5-not-photo/NotPhoto";
import { narrations as notPhotoNarr } from "../chapters/99-t5-not-photo/narrations";
import PhysicsFlaw from "../chapters/100-t5-physics-flaw/PhysicsFlaw";
import { narrations as physicsFlawNarr } from "../chapters/100-t5-physics-flaw/narrations";
import CoursePromiseT5 from "../chapters/101-t5-course-promise/CoursePromise";
import { narrations as coursePromiseT5Narr } from "../chapters/101-t5-course-promise/narrations";
import WhatIsPointcloud from "../chapters/102-t5-what-is-pointcloud/WhatIsPointcloud";
import { narrations as whatIsPointcloudNarr } from "../chapters/102-t5-what-is-pointcloud/narrations";
import FourthDim from "../chapters/103-t5-fourth-dim/FourthDim";
import { narrations as fourthDimNarr } from "../chapters/103-t5-fourth-dim/narrations";
import ThreeDExplore from "../chapters/104-t5-3d-explore/ThreeDExplore";
import { narrations as threeDExploreNarr } from "../chapters/104-t5-3d-explore/narrations";
import Sparsity from "../chapters/105-t5-sparsity/Sparsity";
import { narrations as sparsityNarr } from "../chapters/105-t5-sparsity/narrations";
import Occlusion from "../chapters/106-t5-occlusion/Occlusion";
import { narrations as occlusionNarr } from "../chapters/106-t5-occlusion/narrations";
import IronRule from "../chapters/107-t5-iron-rule/IronRule";
import { narrations as ironRuleNarr } from "../chapters/107-t5-iron-rule/narrations";
import SnowNoise from "../chapters/108-t5-snow-noise/SnowNoise";
import { narrations as snowNoiseNarr } from "../chapters/108-t5-snow-noise/narrations";
import CleanMethods from "../chapters/109-t5-clean-methods/CleanMethods";
import { narrations as cleanMethodsNarr } from "../chapters/109-t5-clean-methods/narrations";
import GroundSeg from "../chapters/110-t5-ground-seg/GroundSeg";
import { narrations as groundSegNarr } from "../chapters/110-t5-ground-seg/narrations";
import SopRule from "../chapters/111-t5-sop-rule/SopRule";
import { narrations as sopRuleNarr } from "../chapters/111-t5-sop-rule/narrations";
import FusionConflict from "../chapters/112-t5-fusion-conflict/FusionConflict";
import { narrations as fusionConflictNarr } from "../chapters/112-t5-fusion-conflict/narrations";
import ConfidenceRule from "../chapters/113-t5-confidence-rule/ConfidenceRule";
import { narrations as confidenceRuleNarr } from "../chapters/113-t5-confidence-rule/narrations";
import LidarOcclusion from "../chapters/114-t5-lidar-occlusion/LidarOcclusion";
import { narrations as lidarOcclusionNarr } from "../chapters/114-t5-lidar-occlusion/narrations";
import FusionSOP from "../chapters/115-t5-fusion-sop/FusionSOP";
import { narrations as fusionSOPNarr } from "../chapters/115-t5-fusion-sop/narrations";
import AllRecap from "../chapters/116-t5-all-recap/AllRecap";
import { narrations as allRecapNarr } from "../chapters/116-t5-all-recap/narrations";
import PortAssignment from "../chapters/117-t5-port-assignment/PortAssignment";
import { narrations as portAssignmentNarr } from "../chapters/117-t5-port-assignment/narrations";
import PointQuiz from "../chapters/118-t5-point-quiz/PointQuiz";
import { narrations as pointQuizNarr } from "../chapters/118-t5-point-quiz/narrations";
import Farewell from "../chapters/119-t5-farewell/Farewell";
import { narrations as farewellNarr } from "../chapters/119-t5-farewell/narrations";

export const CHAPTERS: ChapterDef[] = [
  {
    id: "opening",
    title: "开幕：翁老师问候",
    narrations: openingNarrations,
    Component: Opening,
  },
  {
    id: "report",
    title: "AI 验收失败报告",
    narrations: reportNarrations,
    Component: Report,
  },
  {
    id: "conflict",
    title: "算法 vs 业务冲突",
    narrations: conflictNarrations,
    Component: Conflict,
  },
  {
    id: "identity",
    title: "训练师角色定位",
    narrations: identityNarrations,
    Component: Identity,
  },
  {
    id: "promise",
    title: "课程预告与承诺",
    narrations: promiseNarrations,
    Component: Promise,
  },
  {
    id: "s2-myth",
    title: "AI项目谬误破除",
    narrations: s2MythNarr,
    Component: S2Myth,
  },
  {
    id: "s2-gear-overview",
    title: "五齿轮全链路总览",
    narrations: s2GONarr,
    Component: S2GearOverview,
  },
  {
    id: "s2-gear-demand",
    title: "需求定义：把愿望翻译为指标",
    narrations: s2GDNarr,
    Component: S2GearDemand,
  },
  {
    id: "s2-prep-model",
    title: "数据准备与模型训练",
    narrations: s2PMNarr,
    Component: S2PrepModel,
  },
  {
    id: "s2-integration",
    title: "系统集成与运营迭代",
    narrations: s2IGNarr,
    Component: S2Integration,
  },
  {
    id: "s2-bank-case",
    title: "银行智能催收案例",
    narrations: s2BCNarr,
    Component: S2BankCase,
  },
  {
    id: "s2-valve",
    title: "AI智能阀门与总结",
    narrations: s2VLNarr,
    Component: S2Valve,
  },
  {
    id: "s3-blood",
    title: "数据是流程的血液",
    narrations: s3BldNarr,
    Component: S3Blood,
  },
  {
    id: "s3-pyramid",
    title: "三类数据金字塔",
    narrations: s3PyrNarr,
    Component: S3Pyramid,
  },
  {
    id: "s3-unstructured",
    title: "非结构化数据：大模型主粮",
    narrations: s3UnsNarr,
    Component: S3Unstructured,
  },
  {
    id: "s3-breakpoint",
    title: "数据断点：隐形的炸弹",
    narrations: s3BrkNarr,
    Component: S3Breakpoint,
  },
  {
    id: "s3-crack",
    title: "系统裂痕与代价",
    narrations: s3CrkNarr,
    Component: S3Crack,
  },
  {
    id: "s3-consequence",
    title: "项目延期与费用损失",
    narrations: s3CsqNarr,
    Component: S3Consequence,
  },
  {
    id: "s3-value",
    title: "训练师核心价值：揪出数据孤岛",
    narrations: s3ValNarr,
    Component: S3Value,
  },
  {
    id: "s4-intro",
    title: "实战找茬：智慧餐厅AI系统",
    narrations: s4IntNarr,
    Component: S4Intro,
  },
  {
    id: "s4-flow",
    title: "原始流程图：五个节点",
    narrations: s4FlwNarr,
    Component: S4Flow,
  },
  {
    id: "s4-pause",
    title: "按下暂停键，找出漏洞",
    narrations: s4PauNarr,
    Component: S4Pause,
  },
  {
    id: "s4-fix1",
    title: "漏洞1：缺失输入数据源",
    narrations: s4F1Narr,
    Component: S4Fix1,
  },
  {
    id: "s4-fix2",
    title: "漏洞2：缺失反馈闭环",
    narrations: s4F2Narr,
    Component: S4Fix2,
  },
  {
    id: "s4-conclusion",
    title: "不看画了多少框，只看数据闭环",
    narrations: s4ConNarr,
    Component: S4Conclusion,
  },
  {
    id: "s5-recap",
    title: "本节回顾：四大核心模块",
    narrations: s5RecNarr,
    Component: S5Recap,
  },
  {
    id: "s5-motto",
    title: "AI的尽头是业务，业务的底座是数据",
    narrations: s5MotNarr,
    Component: S5Motto,
  },
  {
    id: "s5-assignment",
    title: "通关任务与课后作业",
    narrations: s5AsgNarr,
    Component: S5Assignment,
  },
  {
    id: "s5-quiz",
    title: "课后测验与问卷",
    narrations: s5QizNarr,
    Component: S5Quiz,
    interactiveSteps: [2, 3],
  },
  {
    id: "s5-next",
    title: "下节课预告与告别",
    narrations: s5NxtNarr,
    Component: S5Next,
  },
  {
    id: "t2-conflict-scene",
    title: "算法vs业务：微信截图冲突",
    narrations: conflictSceneNarr,
    Component: ConflictScene,
  },
  {
    id: "t2-surgeon-role",
    title: "数据外科医生：训练师定位",
    narrations: surgeonRoleNarr,
    Component: SurgeonRole,
  },
  {
    id: "t2-method-promise",
    title: "方法论承诺：终结低级扯皮",
    narrations: methodPromiseNarr,
    Component: MethodPromise,
  },
  {
    id: "t2-pipeline-overview",
    title: "五步流水线全景",
    narrations: pipelineOverviewNarr,
    Component: PipelineOverview,
  },
  {
    id: "t2-deidentify-redline",
    title: "脱敏：生死红线",
    narrations: deidentifyRedlineNarr,
    Component: DeidentifyRedline,
  },
  {
    id: "t2-deidentify-tech",
    title: "正则与NER：脱敏技术栈",
    narrations: deidentifyTechNarr,
    Component: DeidentifyTech,
  },
  {
    id: "t2-clean-transform",
    title: "清洗与转换",
    narrations: cleanTransformNarr,
    Component: CleanTransform,
  },
  {
    id: "t2-augment",
    title: "数据增强",
    narrations: augmentNarr,
    Component: Augment,
  },
  {
    id: "t2-pipeline-wrap",
    title: "五步收束：合规优先",
    narrations: pipelineWrapNarr,
    Component: PipelineWrap,
  },
  {
    id: "t2-car-voice-intro",
    title: "案例引入：车机语音助手",
    narrations: carVoiceIntroNarr,
    Component: CarVoiceIntro,
  },
  {
    id: "t2-dirty-log",
    title: "展示原始脏日志",
    narrations: dirtyLogNarr,
    Component: DirtyLog,
  },
  {
    id: "t2-blade-noise",
    title: "第一刀：去噪手术",
    narrations: bladeNoiseNarr,
    Component: BladeNoise,
  },
  {
    id: "t2-blade-deidentify",
    title: "第二刀：脱敏手术",
    narrations: bladeDeidentifyNarr,
    Component: BladeDeidentify,
  },
  {
    id: "t2-blade-split",
    title: "第三刀：意图拆分",
    narrations: bladeSplitNarr,
    Component: BladeSplit,
  },
  {
    id: "t2-clean-result",
    title: "手术结果：化腐朽为神奇",
    narrations: cleanResultNarr,
    Component: CleanResult,
  },
  {
    id: "t2-irony-example",
    title: "反讽案例：好评还是差评",
    narrations: ironyExampleNarr,
    Component: IronyExample,
  },
  {
    id: "t2-label-chaos",
    title: "标注混乱：一致性崩塌",
    narrations: labelChaosNarr,
    Component: LabelChaos,
  },
  {
    id: "t2-guideline",
    title: "标注指南：白纸黑字的规则",
    narrations: guidelineNarr,
    Component: Guideline,
  },
  {
    id: "t2-golden-samples",
    title: "Golden Samples 金标准示例",
    narrations: goldenSamplesNarr,
    Component: GoldenSamples,
  },
  {
    id: "t2-core-value",
    title: "训练师核心价值：不可替代",
    narrations: coreValueNarr,
    Component: CoreValue,
  },
  {
    id: "t2-recap",
    title: "本课复盘：四大核心模块",
    narrations: recapNarr,
    Component: Recap,
  },
  {
    id: "t2-quiz",
    title: "随堂弹题：场景判断",
    narrations: quizNarr,
    Component: Quiz,
  },
  {
    id: "t2-sop-assignment",
    title: "通关任务：SOP模板作业",
    narrations: sopAssignmentNarr,
    Component: SopAssignment,
  },
  {
    id: "t2-metric",
    title: "四级评估与行业价值",
    narrations: metricNarr,
    Component: Metric,
  },
  {
    id: "t2-next",
    title: "下节课预告与告别",
    narrations: nextNarr,
    Component: Next,
  },
  {
    id: "t3-tsunami",
    title: "视频海啸：千路监控压垮AI项目",
    narrations: tsunamiNarr,
    Component: Tsunami,
  },
  {
    id: "t3-pb-vs-image",
    title: "视频≠放大图片：时空属性",
    narrations: pbVsImageNarr,
    Component: PbVsImage,
  },
  {
    id: "t3-rookie-mistake",
    title: "每秒30帧：新手的代价",
    narrations: rookieMistakeNarr,
    Component: RookieMistake,
  },
  {
    id: "t3-course-promise",
    title: "从按钮操作员到数据架构师",
    narrations: coursePromiseT3Narr,
    Component: CoursePromiseT3,
  },
  {
    id: "t3-reduce-dim",
    title: "降维打击：抽帧方法论总览",
    narrations: reduceDimNarr,
    Component: ReduceDim,
  },
  {
    id: "t3-sword-uniform",
    title: "第一剑：均匀抽帧",
    narrations: swordUniformNarr,
    Component: SwordUniform,
  },
  {
    id: "t3-sword-keyframe",
    title: "第二剑：I帧提取",
    narrations: swordKeyframeNarr,
    Component: SwordKeyframe,
  },
  {
    id: "t3-sword-event",
    title: "第三剑：事件触发抽帧",
    narrations: swordEventNarr,
    Component: SwordEvent,
  },
  {
    id: "t3-garbage",
    title: "三剑客速查表与决策框架",
    narrations: garbageNarr,
    Component: Garbage,
  },
  {
    id: "t3-scenario",
    title: "算账案例：工地安全帽检测",
    narrations: scenarioNarr,
    Component: Scenario,
  },
  {
    id: "t3-plan-a",
    title: "方案A：全量均匀抽帧的灾难",
    narrations: planANarr,
    Component: PlanA,
  },
  {
    id: "t3-plan-b",
    title: "方案B：事件触发+降采样",
    narrations: planBNarr,
    Component: PlanB,
  },
  {
    id: "t3-cost-crush",
    title: "成本碾压：A vs B 对比表",
    narrations: costCrushNarr,
    Component: CostCrush,
  },
  {
    id: "t3-business-value",
    title: "数据策略的商业穿透力",
    narrations: businessValueNarr,
    Component: BusinessValue,
  },
  {
    id: "t3-video-deident",
    title: "视频脱敏：可视化隐私的合规红线",
    narrations: videoDeidentNarr,
    Component: VideoDeident,
  },
  {
    id: "t3-id-switch",
    title: "ID跳变：目标跟踪的幽灵问题",
    narrations: idSwitchNarr,
    Component: IdSwitch,
  },
  {
    id: "t3-id-solution",
    title: "消灭ID跳变：三条规则",
    narrations: idSolutionNarr,
    Component: IdSolution,
  },
  {
    id: "t3-core-barrier",
    title: "训练师核心壁垒：物理规律→标注规则",
    narrations: coreBarrierNarr,
    Component: CoreBarrier,
  },
  {
    id: "t3-recap",
    title: "全课复盘：三大核心模块",
    narrations: recapT3Narr,
    Component: RecapT3,
  },
  {
    id: "t3-quiz",
    title: "随堂弹题：抽帧策略选择",
    narrations: quizT3Narr,
    Component: QuizT3,
  },
  {
    id: "t3-sop",
    title: "通关考核：视频SOP模板",
    narrations: sopT3Narr,
    Component: SopT3,
  },
  {
    id: "t3-next",
    title: "下节课预告：语音类数据处理",
    narrations: nextT3Narr,
    Component: NextT3,
  },
  {
    id: "t4-callcenter-disaster",
    title: "客服录音：方言+噪音的灾难现场",
    narrations: callcenterDisasterNarr,
    Component: CallcenterDisaster,
  },
  {
    id: "t4-asr-fail",
    title: "ASR翻车：当AI听不懂人话",
    narrations: asrFailNarr,
    Component: AsrFail,
  },
  {
    id: "t4-3d-maze",
    title: "语音=三维迷宫：物理·时序·语义",
    narrations: threeDMazeNarr,
    Component: ThreeDMaze,
  },
  {
    id: "t4-course-promise",
    title: "课程承诺：三项核心能力",
    narrations: coursePromiseT4Narr,
    Component: CoursePromiseT4,
  },
  {
    id: "t4-waveform-spectrogram",
    title: "给声音做CT：波形图与语谱图",
    narrations: waveformSpectrogramNarr,
    Component: WaveformSpectrogram,
  },
  {
    id: "t4-sample-rate",
    title: "采样率：8k vs 16k的铁律",
    narrations: sampleRateNarr,
    Component: SampleRate,
  },
  {
    id: "t4-channel",
    title: "声道：左右分轨的致命陷阱",
    narrations: channelNarr,
    Component: Channel,
  },
  {
    id: "t4-bit-depth",
    title: "位深与三大属性小结",
    narrations: bitDepthNarr,
    Component: BitDepth,
  },
  {
    id: "t4-vad-intro",
    title: "VAD静音检测：切除无效沉默",
    narrations: vadIntroNarr,
    Component: VadIntro,
  },
  {
    id: "t4-slicing",
    title: "语义级平滑切片+Overlap",
    narrations: slicingNarr,
    Component: Slicing,
  },
  {
    id: "t4-crosstalk",
    title: "幽灵重叠音：脏数据还是无价之宝",
    narrations: crosstalkNarr,
    Component: Crosstalk,
  },
  {
    id: "t4-judgment",
    title: "统一框架：先定目标再定策略",
    narrations: judgmentNarr,
    Component: Judgment,
  },
  {
    id: "t4-guideline-intro",
    title: "转写指南：三大灵魂拷问",
    narrations: guidelineIntroNarr,
    Component: GuidelineIntro,
  },
  {
    id: "t4-hesitation-stutter",
    title: "拷问一：语气词与口吃",
    narrations: hesitationStutterNarr,
    Component: HesitationStutter,
  },
  {
    id: "t4-dialect",
    title: "拷问二：方言=模型的疫苗",
    narrations: dialectNarr,
    Component: Dialect,
  },
  {
    id: "t4-voiceprivacy",
    title: "声纹隐私脱敏",
    narrations: voicePrivacyNarr,
    Component: VoicePrivacy,
  },
  {
    id: "t4-recap",
    title: "全课复盘：三大核心模块",
    narrations: recapT4Narr,
    Component: RecapT4,
  },
  {
    id: "t4-quiz",
    title: "随堂弹题：音频属性与切片策略",
    narrations: quizT4Narr,
    Component: QuizT4,
  },
  {
    id: "t4-sop",
    title: "通关考核：医疗问诊SOP模板",
    narrations: sopT4Narr,
    Component: SopT4,
  },
  {
    id: "t4-next",
    title: "下节课预告：点云类数据处理",
    narrations: nextT4Narr,
    Component: NextT4,
  },
  {
    id: "t5-black-truck",
    title: "黑色货车追尾：LiDAR为何看不到",
    narrations: blackTruckNarr,
    Component: BlackTruck,
  },
  {
    id: "t5-not-photo",
    title: "点云≠3D照片：激光摸象",
    narrations: notPhotoNarr,
    Component: NotPhoto,
  },
  {
    id: "t5-physics-flaw",
    title: "物理缺陷=训练师的战场",
    narrations: physicsFlawNarr,
    Component: PhysicsFlaw,
  },
  {
    id: "t5-course-promise",
    title: "课程结构：四维→盲区→清洗→仲裁",
    narrations: coursePromiseT5Narr,
    Component: CoursePromiseT5,
  },
  {
    id: "t5-what-is-pointcloud",
    title: "什么是点云：百万束激光的空间采样",
    narrations: whatIsPointcloudNarr,
    Component: WhatIsPointcloud,
  },
  {
    id: "t5-fourth-dim",
    title: "第四维：反射率 Intensity",
    narrations: fourthDimNarr,
    Component: FourthDim,
  },
  {
    id: "t5-3d-explore",
    title: "交互探索：操控三维点云场景",
    narrations: threeDExploreNarr,
    Component: ThreeDExplore,
  },
  {
    id: "t5-sparsity",
    title: "先天盲区一：稀疏性",
    narrations: sparsityNarr,
    Component: Sparsity,
  },
  {
    id: "t5-occlusion",
    title: "先天盲区二：遮挡与透视无能",
    narrations: occlusionNarr,
    Component: Occlusion,
  },
  {
    id: "t5-iron-rule",
    title: "S2回顾：四维+两盲区→标注兜底",
    narrations: ironRuleNarr,
    Component: IronRule,
  },
  {
    id: "t5-snow-noise",
    title: "雪花噪点：雨雪天的幽灵刹车",
    narrations: snowNoiseNarr,
    Component: SnowNoise,
  },
  {
    id: "t5-clean-methods",
    title: "清洗两大武器：时序滤波+反射率阈值",
    narrations: cleanMethodsNarr,
    Component: CleanMethods,
  },
  {
    id: "t5-ground-seg",
    title: "地面分割：马路vs障碍物",
    narrations: groundSegNarr,
    Component: GroundSeg,
  },
  {
    id: "t5-sop-rule",
    title: "S3回顾：训练师=物理世界转译者",
    narrations: sopRuleNarr,
    Component: SopRule,
  },
  {
    id: "t5-fusion-conflict",
    title: "Camera-LiDAR融合：数据打架怎么判",
    narrations: fusionConflictNarr,
    Component: FusionConflict,
  },
  {
    id: "t5-confidence-rule",
    title: "置信度分级与仲裁规则",
    narrations: confidenceRuleNarr,
    Component: ConfidenceRule,
  },
  {
    id: "t5-lidar-occlusion",
    title: "虚拟3D框 + LiDAR_Occlusion标签",
    narrations: lidarOcclusionNarr,
    Component: LidarOcclusion,
  },
  {
    id: "t5-fusion-sop",
    title: "专家级SOP：降维打击思维",
    narrations: fusionSOPNarr,
    Component: FusionSOP,
  },
  {
    id: "t5-all-recap",
    title: "完整回顾：四维→盲区→清洗→仲裁",
    narrations: allRecapNarr,
    Component: AllRecap,
  },
  {
    id: "t5-port-assignment",
    title: "港口集装箱卡车SOP作业发布",
    narrations: portAssignmentNarr,
    Component: PortAssignment,
  },
  {
    id: "t5-point-quiz",
    title: "物理特性与融合仲裁测试题",
    narrations: pointQuizNarr,
    Component: PointQuiz,
    interactiveSteps: [2, 3],
  },
  {
    id: "t5-farewell",
    title: "下节课预告 + 翁老师告别",
    narrations: farewellNarr,
    Component: Farewell,
  },
];
