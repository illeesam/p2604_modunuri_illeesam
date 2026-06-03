package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRawRepository;
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
public class StSettleRawService {

    private final StSettleRawRepository stSettleRawRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 원천 데이터 키조회 */
    public StSettleRawDto.Item getById(String id) {
        StSettleRawDto.Item dto = stSettleRawRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleRawDto.Item getByIdOrNull(String id) {
        return stSettleRawRepository.selectById(id).orElse(null);
    }

    /* 정산 원천 데이터 상세조회 */
    public StSettleRaw findById(String id) {
        return stSettleRawRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleRaw findByIdOrNull(String id) {
        return stSettleRawRepository.findById(id).orElse(null);
    }

    /* 정산 원천 데이터 키검증 */
    public boolean existsById(String id) {
        return stSettleRawRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleRawRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 원천 데이터 목록조회 */
    public List<StSettleRawDto.Item> getList(StSettleRawDto.Request req) {
        return stSettleRawRepository.selectList(req);
    }

    /* 정산 원천 데이터 페이지조회 */
    public StSettleRawDto.PageResponse getPageData(StSettleRawDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleRawRepository.selectPageData(req);
    }

    /* 정산 원천 데이터 등록 */
    @Transactional
    public StSettleRaw create(StSettleRaw body) {
        body.setSettleRawId(CmUtil.generateId("st_settle_raw"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 정산 원천 데이터 수정 */
    @Transactional
    public StSettleRaw update(String id, StSettleRaw body) {
        CmUtil.requireId(id, "id", this);
        StSettleRaw entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleRawId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleRaw saved = stSettleRawRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 원천 데이터 수정 */
    @Transactional
    public StSettleRaw updateSelective(StSettleRaw entity) {
        if (entity.getSettleRawId() == null) throw new CmBizException("settleRawId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleRawId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleRawId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleRawRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 정산 원천 데이터 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StSettleRaw entity = findById(id);
        stSettleRawRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StSettleRaw saveOneBase(StSettleRaw entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getSettleRawId() == null || entity.getSettleRawId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getSettleRawId() == null)
                throw new CmBizException("삭제 대상 settleRawId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!stSettleRawRepository.existsById(entity.getSettleRawId()))
                throw new CmBizException("존재하지 않는 StSettleRaw입니다: " + entity.getSettleRawId() + "::" + CmUtil.svcCallerInfo(this));
            stSettleRawRepository.deleteById(entity.getSettleRawId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSettleRawId(CmUtil.generateId("st_settle_raw"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            StSettleRaw saved = stSettleRawRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSettleRawId() == null)
                throw new CmBizException("수정 대상 settleRawId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = stSettleRawRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 StSettleRaw입니다: " + entity.getSettleRawId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getSettleRawId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<StSettleRaw> rows) {
        /* 0단계: rowStatus 정규화 */
        for (StSettleRaw row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSettleRawId() == null || row.getSettleRawId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, StSettleRaw::getSettleRawId, "U", "settleRawId", this);
        CmUtil.requireRowIds(rows, StSettleRaw::getSettleRawId, "D", "settleRawId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(StSettleRaw::getSettleRawId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleRawRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<StSettleRaw> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (StSettleRaw row : updateRows) {
            row.setUpdBy(authId);
            int affected = stSettleRawRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSettleRawId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<StSettleRaw> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleRaw row : insertRows) {
            row.setSettleRawId(CmUtil.generateId("st_settle_raw"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleRawRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
