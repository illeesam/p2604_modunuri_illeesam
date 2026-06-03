package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleConfigRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StSettleConfigService {

    private final StSettleConfigRepository stSettleConfigRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 설정 키조회 */
    public StSettleConfigDto.Item getById(String id) {
        StSettleConfigDto.Item dto = stSettleConfigRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleConfigDto.Item getByIdOrNull(String id) {
        return stSettleConfigRepository.selectById(id).orElse(null);
    }

    /* 정산 설정 상세조회 */
    public StSettleConfig findById(String id) {
        return stSettleConfigRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleConfig findByIdOrNull(String id) {
        return stSettleConfigRepository.findById(id).orElse(null);
    }

    /* 정산 설정 키검증 */
    public boolean existsById(String id) {
        return stSettleConfigRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleConfigRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 설정 목록조회 */
    public List<StSettleConfigDto.Item> getList(StSettleConfigDto.Request req) {
        return stSettleConfigRepository.selectList(req);
    }

    /* 정산 설정 페이지조회 */
    public StSettleConfigDto.PageResponse getPageData(StSettleConfigDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleConfigRepository.selectPageData(req);
    }

    /* 정산 설정 등록 */
    @Transactional
    public StSettleConfig create(StSettleConfig body) {
        body.setSettleConfigId(CmUtil.generateId("st_settle_config"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 정산 설정 수정 */
    @Transactional
    public StSettleConfig update(String id, StSettleConfig body) {
        CmUtil.requireId(id, "id", this);
        StSettleConfig entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleConfigId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleConfig saved = stSettleConfigRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 설정 수정 */
    @Transactional
    public StSettleConfig updateSelective(StSettleConfig entity) {
        if (entity.getSettleConfigId() == null) throw new CmBizException("settleConfigId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleConfigId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleConfigId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleConfigRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 정산 설정 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StSettleConfig entity = findById(id);
        stSettleConfigRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StSettleConfig saveOneBase(StSettleConfig entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getSettleConfigId() == null || entity.getSettleConfigId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getSettleConfigId() == null)
                throw new CmBizException("삭제 대상 settleConfigId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!stSettleConfigRepository.existsById(entity.getSettleConfigId()))
                throw new CmBizException("존재하지 않는 StSettleConfig입니다: " + entity.getSettleConfigId() + "::" + CmUtil.svcCallerInfo(this));
            stSettleConfigRepository.deleteById(entity.getSettleConfigId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSettleConfigId(CmUtil.generateId("st_settle_config"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            StSettleConfig saved = stSettleConfigRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSettleConfigId() == null)
                throw new CmBizException("수정 대상 settleConfigId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = stSettleConfigRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StSettleConfig입니다: " + entity.getSettleConfigId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getSettleConfigId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StSettleConfig> rows) {
        /* 0단계: rowStatus 정규화 */
        for (StSettleConfig row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSettleConfigId() == null || row.getSettleConfigId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StSettleConfig::getSettleConfigId, "U", "settleConfigId", this);
        CmUtil.requireRowIds(rows, StSettleConfig::getSettleConfigId, "D", "settleConfigId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StSettleConfig::getSettleConfigId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleConfigRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<StSettleConfig> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (StSettleConfig row : updateRows) {
            row.setUpdBy(authId);
            int affected = stSettleConfigRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSettleConfigId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<StSettleConfig> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleConfig row : insertRows) {
            row.setSettleConfigId(CmUtil.generateId("st_settle_config"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleConfigRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
