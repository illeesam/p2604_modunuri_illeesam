package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdRestockNotiMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdRestockNotiRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoPdRestockNotiService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PdRestockNotiMapper pdRestockNotiMapper;
    private final PdRestockNotiRepository pdRestockNotiRepository;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PdRestockNotiDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pdRestockNotiMapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PdRestockNotiDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pdRestockNotiMapper.selectPageList(p), pdRestockNotiMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public PdRestockNotiDto getById(String id) {
        PdRestockNotiDto dto = pdRestockNotiMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public PdRestockNoti create(PdRestockNoti body) {
        body.setRestockNotiId("RN" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public PdRestockNotiDto update(String id, PdRestockNoti body) {
        PdRestockNoti entity = pdRestockNotiRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "restockNotiId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        PdRestockNoti entity = pdRestockNotiRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        pdRestockNotiRepository.delete(entity);
        em.flush();
        if (pdRestockNotiRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** send — 전송 */
    public void send(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null || ids.isEmpty()) return;
        log.info("재입고알림 발송 요청 - ids={}", ids);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PdRestockNoti> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRestockNotiId() != null)
            .map(PdRestockNoti::getRestockNotiId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdRestockNotiRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (PdRestockNoti row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getRestockNotiId(), "restockNotiId must not be null");
            PdRestockNoti entity = pdRestockNotiRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "restockNotiId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdRestockNotiRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (PdRestockNoti row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setRestockNotiId("RN" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdRestockNotiRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
