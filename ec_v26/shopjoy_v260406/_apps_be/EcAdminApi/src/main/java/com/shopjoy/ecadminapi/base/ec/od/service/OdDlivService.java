package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
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
public class OdDlivService {

    private final OdDlivRepository odDlivRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배송 키조회 */
    public OdDlivDto.Item getById(String id) {
        OdDlivDto.Item dto = odDlivRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdDlivDto.Item getByIdOrNull(String id) {
        return odDlivRepository.selectById(id).orElse(null);
    }

    /* 배송 상세조회 */
    public OdDliv findById(String id) {
        return odDlivRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdDliv findByIdOrNull(String id) {
        return odDlivRepository.findById(id).orElse(null);
    }

    /* 배송 키검증 */
    public boolean existsById(String id) {
        return odDlivRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odDlivRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 배송 목록조회 */
    public List<OdDlivDto.Item> getList(OdDlivDto.Request req) {
        return odDlivRepository.selectList(req);
    }

    /* 배송 페이지조회 */
    public OdDlivDto.PageResponse getPageData(OdDlivDto.Request req) {
        PageHelper.addPaging(req);
        return odDlivRepository.selectPageData(req);
    }

    /* 배송 등록 */
    @Transactional
    public OdDliv create(OdDliv body) {
        body.setDlivId(CmUtil.generateId("od_dliv"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 배송 수정 */
    @Transactional
    public OdDliv update(String id, OdDliv body) {
        CmUtil.requireId(id, "id", this);
        OdDliv entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 수정 */
    @Transactional
    public OdDliv updateSelective(OdDliv entity) {
        if (entity.getDlivId() == null) throw new CmBizException("dlivId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDlivId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odDlivRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 배송 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdDliv entity = findById(id);
        odDlivRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdDliv saveOneBase(OdDliv entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getDlivId() == null || entity.getDlivId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getDlivId() == null)
                throw new CmBizException("삭제 대상 dlivId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!odDlivRepository.existsById(entity.getDlivId()))
                throw new CmBizException("존재하지 않는 OdDliv입니다: " + entity.getDlivId() + "::" + CmUtil.svcCallerInfo(this));
            odDlivRepository.deleteById(entity.getDlivId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setDlivId(CmUtil.generateId("od_dliv"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            OdDliv saved = odDlivRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getDlivId() == null)
                throw new CmBizException("수정 대상 dlivId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = odDlivRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdDliv입니다: " + entity.getDlivId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getDlivId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdDliv> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdDliv row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getDlivId() == null || row.getDlivId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdDliv::getDlivId, "U", "dlivId", this);
        CmUtil.requireRowIds(rows, OdDliv::getDlivId, "D", "dlivId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdDliv::getDlivId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odDlivRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdDliv> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdDliv row : updateRows) {
            row.setUpdBy(authId);
            int affected = odDlivRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDlivId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdDliv> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdDliv row : insertRows) {
            row.setDlivId(CmUtil.generateId("od_dliv"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odDlivRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
