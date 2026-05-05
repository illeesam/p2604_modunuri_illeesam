package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.vo.SyAlarmReq;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAlarmMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAlarmRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyAlarmService {

    private final SyAlarmMapper syAlarmMapper;
    private final SyAlarmRepository syAlarmRepository;
    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyAlarmDto getById(String id) {
        // sy_alarm :: select one :: id [orm:mybatis]
        SyAlarmDto result = syAlarmMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyAlarmDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_alarm :: select list :: p [orm:mybatis]
        List<SyAlarmDto> result = syAlarmMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyAlarmDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_alarm :: select page :: p [orm:mybatis]
        return PageResult.of(syAlarmMapper.selectPageList(p), syAlarmMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyAlarm entity) {
        // sy_alarm :: update :: entity [orm:mybatis]
        int result = syAlarmMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyAlarm create(SyAlarm entity) {
        entity.setAlarmId(CmUtil.generateId("sy_alarm"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_alarm :: insert or update :: [orm:jpa]
        SyAlarm result = syAlarmRepository.save(entity);
        return result;
    }

    @Transactional
    public SyAlarm save(SyAlarm entity) {
        if (!syAlarmRepository.existsById(entity.getAlarmId())) {
            throw new CmBizException("존재하지 않는 알람입니다: " + entity.getAlarmId());
        }
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_alarm :: insert or update :: [orm:jpa]
        SyAlarm result = syAlarmRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyAlarm entity = syAlarmRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syAlarmRepository.delete(entity);
        em.flush();
        if (syAlarmRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    // ── _row_status 기반 저장 ────────────────────────────────────

    @Transactional
    public SyAlarm saveByRowStatus(SyAlarmReq req) {
        SyAlarm result = doSaveByRowStatus(req);
        return result;
    }

    // D → U → I 순서로 처리: 삭제 후 수정, 마지막에 신규 등록하여 유니크 제약 충돌 방지
    @Transactional
    public List<SyAlarm> saveListByRowStatus(List<SyAlarmReq> list) {
        List<SyAlarm> result = new ArrayList<>();
        for (SyAlarmReq req : list.stream().filter(r -> "D".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (SyAlarmReq req : list.stream().filter(r -> "U".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (SyAlarmReq req : list.stream().filter(r -> "I".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        return result;
    }

    private SyAlarm doSaveByRowStatus(SyAlarmReq req) {
        return switch (req.getRowStatus()) {
            case "I" -> create(req.toEntity());
            case "U" -> {
                if (!syAlarmRepository.existsById(req.getAlarmId()))
                    throw new CmBizException("존재하지 않는 알람입니다: " + req.getAlarmId());
                yield save(req.toEntity());
            }
            case "D" -> {
                if (!syAlarmRepository.existsById(req.getAlarmId()))
                    throw new CmBizException("존재하지 않는 알람입니다: " + req.getAlarmId());
                // sy_alarm :: delete :: alarmId [orm:jpa]
                syAlarmRepository.deleteById(req.getAlarmId());
                yield null;
            }
            default -> throw new CmBizException("올바르지 않은 _row_status: " + req.getRowStatus());
        };
    }

    /**
     * ID 생성 규칙: {테이블prefix}{yyMMddHHmmss}{rand4}
     *
     * 테이블 prefix 산출 방법 (도메인 세그먼트 제외, 대문자):
     *   1. 첫 번째 세그먼트(도메인: cm/od/sy 등) 제외
     *   2. 두 번째 세그먼트(엔티티명) 앞 2자
     *   3. 세 번째 이후 세그먼트의 첫 글자
     *
     * 예시:
     *   sy_alarm → AL(alarm) = AL
     */
}
