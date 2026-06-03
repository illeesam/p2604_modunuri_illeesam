package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
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
public class MbMemberAddrService {

    private final MbMemberAddrRepository mbMemberAddrRepository;

    @PersistenceContext
    private EntityManager em;

    /* 회원 주소 키조회 */
    public MbMemberAddrDto.Item getById(String id) {
        MbMemberAddrDto.Item dto = mbMemberAddrRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberAddrDto.Item getByIdOrNull(String id) {
        return mbMemberAddrRepository.selectById(id).orElse(null);
    }

    /* 회원 주소 상세조회 */
    public MbMemberAddr findById(String id) {
        return mbMemberAddrRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberAddr findByIdOrNull(String id) {
        return mbMemberAddrRepository.findById(id).orElse(null);
    }

    /* 회원 주소 키검증 */
    public boolean existsById(String id) {
        return mbMemberAddrRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberAddrRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 회원 주소 목록조회 */
    public List<MbMemberAddrDto.Item> getList(MbMemberAddrDto.Request req) {
        return mbMemberAddrRepository.selectList(req);
    }

    /* 회원 주소 페이지조회 */
    public MbMemberAddrDto.PageResponse getPageData(MbMemberAddrDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberAddrRepository.selectPageData(req);
    }

    /* 회원 주소 등록 */
    @Transactional
    public MbMemberAddr create(MbMemberAddr body) {
        body.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 회원 주소 수정 */
    @Transactional
    public MbMemberAddr update(String id, MbMemberAddr body) {
        CmUtil.requireId(id, "id", this);
        MbMemberAddr entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberAddrId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 주소 수정 */
    @Transactional
    public MbMemberAddr updateSelective(MbMemberAddr entity) {
        if (entity.getMemberAddrId() == null) throw new CmBizException("memberAddrId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberAddrId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberAddrId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberAddrRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 회원 주소 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MbMemberAddr entity = findById(id);
        mbMemberAddrRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbMemberAddr saveOneBase(MbMemberAddr entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getMemberAddrId() == null || entity.getMemberAddrId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getMemberAddrId() == null)
                throw new CmBizException("삭제 대상 memberAddrId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!mbMemberAddrRepository.existsById(entity.getMemberAddrId()))
                throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + entity.getMemberAddrId() + "::" + CmUtil.svcCallerInfo(this));
            mbMemberAddrRepository.deleteById(entity.getMemberAddrId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            MbMemberAddr saved = mbMemberAddrRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getMemberAddrId() == null)
                throw new CmBizException("수정 대상 memberAddrId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = mbMemberAddrRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + entity.getMemberAddrId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getMemberAddrId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<MbMemberAddr> rows) {
        /* 0단계: rowStatus 정규화 */
        for (MbMemberAddr row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getMemberAddrId() == null || row.getMemberAddrId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MbMemberAddr::getMemberAddrId, "U", "memberAddrId", this);
        CmUtil.requireRowIds(rows, MbMemberAddr::getMemberAddrId, "D", "memberAddrId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(MbMemberAddr::getMemberAddrId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberAddrRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<MbMemberAddr> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (MbMemberAddr row : updateRows) {
            row.setUpdBy(authId);
            int affected = mbMemberAddrRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getMemberAddrId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<MbMemberAddr> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberAddr row : insertRows) {
            row.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberAddrRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
