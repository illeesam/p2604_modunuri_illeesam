package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleEtcAdjRepository;
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
public class StSettleEtcAdjService {

    private final StSettleEtcAdjRepository stSettleEtcAdjRepository;

    @PersistenceContext
    private EntityManager em;

    /* 정산 기타 조정 키조회 */
    public StSettleEtcAdjDto.Item getById(String id) {
        StSettleEtcAdjDto.Item dto = stSettleEtcAdjRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleEtcAdjDto.Item getByIdOrNull(String id) {
        return stSettleEtcAdjRepository.selectById(id).orElse(null);
    }

    /* 정산 기타 조정 상세조회 */
    public StSettleEtcAdj findById(String id) {
        return stSettleEtcAdjRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleEtcAdj findByIdOrNull(String id) {
        return stSettleEtcAdjRepository.findById(id).orElse(null);
    }

    /* 정산 기타 조정 키검증 */
    public boolean existsById(String id) {
        return stSettleEtcAdjRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleEtcAdjRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 정산 기타 조정 목록조회 */
    public List<StSettleEtcAdjDto.Item> getList(StSettleEtcAdjDto.Request req) {
        return stSettleEtcAdjRepository.selectList(req);
    }

    /* 정산 기타 조정 페이지조회 */
    public StSettleEtcAdjDto.PageResponse getPageData(StSettleEtcAdjDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleEtcAdjRepository.selectPageData(req);
    }

    /* 정산 기타 조정 등록 */
    @Transactional
    public StSettleEtcAdj create(StSettleEtcAdj body) {
        body.setSettleEtcAdjId(CmUtil.generateId("st_settle_etc_adj"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleEtcAdj saved = stSettleEtcAdjRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 정산 기타 조정 수정 */
    @Transactional
    public StSettleEtcAdj update(String id, StSettleEtcAdj body) {
        CmUtil.requireId(id, "id", this);
        StSettleEtcAdj entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleEtcAdjId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleEtcAdj saved = stSettleEtcAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 정산 기타 조정 수정 */
    @Transactional
    public StSettleEtcAdj updateSelective(StSettleEtcAdj entity) {
        if (entity.getSettleEtcAdjId() == null) throw new CmBizException("settleEtcAdjId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleEtcAdjId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleEtcAdjId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleEtcAdjRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 정산 기타 조정 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        StSettleEtcAdj entity = findById(id);
        stSettleEtcAdjRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public StSettleEtcAdj save(String cmd, StSettleEtcAdj entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getSettleEtcAdjId() == null || entity.getSettleEtcAdjId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getSettleEtcAdjId() == null)
                    throw new CmBizException("삭제 대상 settleEtcAdjId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!stSettleEtcAdjRepository.existsById(entity.getSettleEtcAdjId()))
                    throw new CmBizException("존재하지 않는 StSettleEtcAdj입니다: " + entity.getSettleEtcAdjId() + "::" + CmUtil.svcCallerInfo(this));
                stSettleEtcAdjRepository.deleteById(entity.getSettleEtcAdjId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setSettleEtcAdjId(CmUtil.generateId("st_settle_etc_adj"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                StSettleEtcAdj saved = stSettleEtcAdjRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getSettleEtcAdjId() == null)
                    throw new CmBizException("수정 대상 settleEtcAdjId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = stSettleEtcAdjRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 StSettleEtcAdj입니다: " + entity.getSettleEtcAdjId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getSettleEtcAdjId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<StSettleEtcAdj> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (StSettleEtcAdj row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getSettleEtcAdjId() == null || row.getSettleEtcAdjId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, StSettleEtcAdj::getSettleEtcAdjId, "U", "settleEtcAdjId", this);
            CmUtil.requireRowIds(rows, StSettleEtcAdj::getSettleEtcAdjId, "D", "settleEtcAdjId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(StSettleEtcAdj::getSettleEtcAdjId)
                .toList();
            if (!deleteIds.isEmpty()) {
                stSettleEtcAdjRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<StSettleEtcAdj> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (StSettleEtcAdj row : updateRows) {
                row.setUpdBy(authId);
                int affected = stSettleEtcAdjRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSettleEtcAdjId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<StSettleEtcAdj> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (StSettleEtcAdj row : insertRows) {
                row.setSettleEtcAdjId(CmUtil.generateId("st_settle_etc_adj"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stSettleEtcAdjRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
